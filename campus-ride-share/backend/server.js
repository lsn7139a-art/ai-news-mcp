const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
require('dotenv').config();

const { initDatabase } = require('./database/init');
const { router: authRoutes, authenticateToken } = require('./routes/auth');
const rideRoutes = require('./routes/rides');
const matchRoutes = require('./routes/matches');
const userRoutes = require('./routes/users');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// 限流中间件
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    error: '请求过于频繁，请稍后再试'
  }
});
app.use('/api/', limiter);

// 解析JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/users', userRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'campus-ride-share-backend'
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '接口不存在',
    path: req.originalUrl
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message
  });
});

// Socket.io实时通信
const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);

  // 用户加入房间（基于用户ID）
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    activeUsers.set(userId, socket.id);
    console.log(`用户 ${userId} 已加入房间`);
  });

  // 发送拼车匹配通知
  socket.on('ride_match', (data) => {
    const { requesterId, matchData } = data;
    io.to(`user_${requesterId}`).emit('new_match', matchData);
  });

  // 用户离开
  socket.on('disconnect', () => {
    // 清理活跃用户映射
    for (const [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        activeUsers.delete(userId);
        console.log(`用户 ${userId} 已断开连接`);
        break;
      }
    }
  });
});

// 将io实例传递给路由使用
app.set('io', io);

// 启动服务器
const startServer = async () => {
  try {
    // 初始化数据库
    await new Promise((resolve, reject) => {
      initDatabase();
      resolve();
    });

    server.listen(PORT, () => {
      console.log(`
🚀 车站拼车平台后端服务启动成功！
📍 端口: ${PORT}
🌐 环境: ${process.env.NODE_ENV || 'development'}
📊 实时通信: Socket.io 已启用
⏰ 启动时间: ${new Date().toLocaleString('zh-CN')}
      `);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

startServer();

module.exports = { app, server, io };