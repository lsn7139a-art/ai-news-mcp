const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();
const { dbPath } = require('../database/init');
const JWT_SECRET = process.env.JWT_SECRET || 'campus-ride-share-secret-key';

// 专业列表
const MAJORS = [
  '计算机科学',
  '软件工程',
  '电子信息',
  '机械工程',
  '土木工程',
  '化学工程',
  '材料科学',
  '生物医学',
  '经济学',
  '管理学',
  '外国语言',
  '艺术设计'
];

// 获取数据库连接
const getDB = () => {
  return new sqlite3.Database(dbPath);
};

// 验证学号格式（8位数字）
const validateStudentId = (studentId) => {
  return /^\d{8}$/.test(studentId);
};

// 用户注册
router.post('/register', async (req, res) => {
  const { student_id, password, name, major, personality, phone, email } = req.body;

  // 输入验证
  if (!student_id || !password || !name || !major || personality === undefined) {
    return res.status(400).json({
      error: '必填字段不能为空',
      required: ['student_id', 'password', 'name', 'major', 'personality']
    });
  }

  if (!validateStudentId(student_id)) {
    return res.status(400).json({
      error: '学号格式错误，应为8位数字'
    });
  }

  if (!MAJORS.includes(major)) {
    return res.status(400).json({
      error: '无效的专业选择',
      valid_majors: MAJORS
    });
  }

  if (personality < 1 || personality > 5) {
    return res.status(400).json({
      error: '性格值应在1-5之间'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: '密码长度至少6位'
    });
  }

  if (email && !validator.isEmail(email)) {
    return res.status(400).json({
      error: '邮箱格式错误'
    });
  }

  const db = getDB();

  try {
    // 检查学号是否已存在
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT id FROM users WHERE student_id = ?', [student_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingUser) {
      db.close();
      return res.status(409).json({
        error: '该学号已被注册'
      });
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入新用户
    const result = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (student_id, password, name, major, personality, phone, email) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [student_id, hashedPassword, name, major, personality, phone || null, email || null],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });

    db.close();

    // 生成JWT token
    const token = jwt.sign(
      { userId: result.id, studentId: student_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: result.id,
        student_id,
        name,
        major,
        personality,
        phone,
        email,
        is_verified: false
      }
    });

  } catch (error) {
    db.close();
    console.error('注册错误:', error);
    res.status(500).json({
      error: '注册失败，请稍后重试'
    });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  const { student_id, password } = req.body;

  if (!student_id || !password) {
    return res.status(400).json({
      error: '学号和密码不能为空'
    });
  }

  if (!validateStudentId(student_id)) {
    return res.status(400).json({
      error: '学号格式错误'
    });
  }

  const db = getDB();

  try {
    // 查找用户
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE student_id = ?',
        [student_id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      db.close();
      return res.status(401).json({
        error: '学号或密码错误'
      });
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      db.close();
      return res.status(401).json({
        error: '学号或密码错误'
      });
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId: user.id, studentId: user.student_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 更新最后登录时间
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    db.close();

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        student_id: user.student_id,
        name: user.name,
        major: user.major,
        personality: user.personality,
        phone: user.phone,
        email: user.email,
        is_verified: user.is_verified
      }
    });

  } catch (error) {
    db.close();
    console.error('登录错误:', error);
    res.status(500).json({
      error: '登录失败，请稍后重试'
    });
  }
});

// 验证token中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: '访问令牌缺失'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        error: '访问令牌无效'
      });
    }
    req.user = user;
    next();
  });
};

// 获取当前用户信息
router.get('/me', authenticateToken, async (req, res) => {
  const db = getDB();

  try {
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, student_id, name, major, personality, phone, email, is_verified, created_at FROM users WHERE id = ?',
        [req.user.userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      db.close();
      return res.status(404).json({
        error: '用户不存在'
      });
    }

    db.close();
    res.json({ user });

  } catch (error) {
    db.close();
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      error: '获取用户信息失败'
    });
  }
});

// 获取专业列表
router.get('/majors', (req, res) => {
  res.json({
    majors: MAJORS
  });
});

module.exports = { router, authenticateToken };