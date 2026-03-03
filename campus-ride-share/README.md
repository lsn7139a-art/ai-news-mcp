# 🚗 校园拼车平台

基于三重匹配算法的高信任校园拼车系统，彻底替代QQ群组的低效拼车匹配。

## 🎯 核心特性

### 🧠 三重匹配算法
- **专业相似度匹配 (40%)**：同专业+10分，提升学术交流信任度
- **性格兼容度分析 (30%)**：基于1-5分量表，分差≤1获得高分
- **时间精准度匹配 (30%)**：每超5分钟-2分，≤30分钟获得满分

### 🏫 大学生场景优化
- 学号实名认证，确保真实可信
- 轻量级设计，无需支付（初期免费）
- 支持12个主流专业覆盖
- 实时智能推荐系统

### 🚀 技术亮点
- 完整可部署项目（非概念稿）
- 前端React + 后端Node.js + SQLite数据库
- WebSocket实时通信
- Docker容器化部署
- 响应式设计，支持移动端

## 📋 系统要求

- Node.js 18+
- Docker & Docker Compose
- Git

## 🛠 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd campus-ride-share
```

### 2. 使用Docker部署（推荐）
```bash
# 启动所有服务
docker-compose up -d

# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 3. 手动部署
```bash
# 启动后端
cd backend
npm install
npm run db:init
npm start

# 启动前端（新终端）
cd frontend
npm install
npm start
```

### 4. 访问应用
- 前端：http://localhost:3000
- 后端API：http://localhost:3001
- API文档：http://localhost:3001/api-docs

## 📊 匹配算法详解

### 算法规则
```python
def calculate_match_score(user1, user2):
    # 1. 专业匹配（权重40%）
    major_score = 10 if user1["major"] == user2["major"] else 0
    
    # 2. 性格匹配（权重30%）
    personality_diff = abs(user1["personality"] - user2["personality"])
    personality_score = 5 if personality_diff <= 1 else max(0, 5 - personality_diff)
    
    # 3. 时间匹配（权重30%）
    time_diff = abs((user1["departure_time"] - user2["departure_time"]).total_seconds() / 60)
    time_score = max(0, 10 - (time_diff // 5) * 2)
    
    total_score = major_score + personality_score + time_score
    return {
        "total_score": total_score,  # 满分25分
        "is_match": total_score >= 20  # 仅≥20分才推荐
    }
```

### 评分标准
- **总分≥20分**：高匹配推荐（显示金色标签）
- **总分15-19分**：中等匹配
- **总分<15分**：低匹配，不推荐

## 🏗 项目结构

```
campus-ride-share/
├── backend/                 # 后端服务
│   ├── database/           # 数据库配置
│   ├── routes/            # API路由
│   ├── services/          # 业务逻辑
│   └── server.js          # 服务器入口
├── frontend/               # 前端应用
│   ├── public/            # 静态资源
│   ├── src/               # 源代码
│   │   ├── components/    # 组件
│   │   ├── contexts/      # React Context
│   │   ├── pages/         # 页面
│   │   └── services/      # API服务
│   └── nginx.conf         # Nginx配置
├── docker-compose.yml      # Docker编排
├── Dockerfile             # 后端Docker
└── README.md              # 项目文档
```

## 🔧 API文档

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出

### 拼车相关
- `GET /api/rides` - 获取拼车列表
- `POST /api/rides` - 发布拼车
- `POST /api/rides/:id/join` - 加入拼车
- `DELETE /api/rides/:id` - 取消拼车

### 匹配相关
- `GET /api/matches/find` - 智能匹配
- `POST /api/matches/:id/accept` - 接受匹配
- `POST /api/matches/:id/reject` - 拒绝匹配

## 🔒 安全特性

- JWT身份认证
- 学号实名验证
- 密码加密存储
- CORS跨域保护
- SQL注入防护
- XSS攻击防护

## 📱 功能模块

### 用户管理
- ✅ 用户注册/登录
- ✅ 个人资料管理
- ✅ 实名认证
- ✅ 密码重置

### 拼车管理
- ✅ 发布拼车需求
- ✅ 浏览拼车列表
- ✅ 加入/退出拼车
- ✅ 拼车状态管理

### 智能匹配
- ✅ 三重算法匹配
- ✅ 实时推荐
- ✅ 匹配历史
- ✅ 匹配统计

### 实时通信
- ✅ WebSocket连接
- ✅ 拼车状态推送
- ✅ 匹配通知
- ✅ 在线状态显示

## 🌐 部署指南

### 生产环境部署

1. **环境变量配置**
```bash
# .env
NODE_ENV=production
JWT_SECRET=your-super-secret-key
CORS_ORIGIN=https://your-domain.com
```

2. **数据库初始化**
```bash
cd backend
npm run db:init
```

3. **Docker部署**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### 性能优化

- 前端资源压缩和缓存
- 数据库索引优化
- API响应缓存
- 负载均衡配置

## 🧪 测试

```bash
# 运行后端测试
cd backend
npm test

# 运行前端测试
cd frontend
npm test

# 端到端测试
npm run test:e2e
```

## 📈 监控

- 应用性能监控
- 错误日志收集
- 用户行为分析
- 系统资源监控

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系我们

- 项目维护者：校园拼车团队
- 邮箱：campus-ride@example.com
- 问题反馈：[GitHub Issues](https://github.com/your-repo/issues)

## 🙏 致谢

感谢所有为校园拼车平台做出贡献的开发者和用户！

---

**🚗 让校园出行更智能、更安全、更环保！**