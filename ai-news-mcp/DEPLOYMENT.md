# AI 新闻 MCP 服务器部署指南

## 🚀 快速部署

### 1. 环境要求

- Node.js 16.x 或更高版本
- npm 或 yarn
- 可访问外网的环境（用于抓取新闻）

### 2. 安装步骤

```bash
# 克隆项目
git clone <repository-url>
cd ai-news-mcp

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
```

### 3. 环境变量配置

编辑 `.env` 文件：

```env
# 邮件配置 (必须)
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=587
EMAIL_USER=your-email@qq.com
EMAIL_PASS=your-smtp-authorization-code
RECIPIENT_EMAIL=1372943709@qq.com

# 定时任务 (可选，默认每天早上8点)
CRON_SCHEDULE=0 8 * * *
```

### 4. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 🐳 Docker 部署

### 使用 Docker Compose (推荐)

创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  ai-news-mcp:
    build: .
    container_name: ai-news-mcp
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - EMAIL_HOST=${EMAIL_HOST}
      - EMAIL_PORT=${EMAIL_PORT}
      - EMAIL_USER=${EMAIL_USER}
      - EMAIL_PASS=${EMAIL_PASS}
      - RECIPIENT_EMAIL=${RECIPIENT_EMAIL}
      - CRON_SCHEDULE=${CRON_SCHEDULE:-0 8 * * *}
    volumes:
      - ./logs:/app/logs
    networks:
      - ai-news-network

networks:
  ai-news-network:
    driver: bridge
```

启动服务：

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f ai-news-mcp
```

### 使用纯 Docker

```bash
# 构建镜像
docker build -t ai-news-mcp .

# 运行容器
docker run -d \
  --name ai-news-mcp \
  --restart unless-stopped \
  --env-file .env \
  -v $(pwd)/logs:/app/logs \
  ai-news-mcp
```

## 🌐 云平台部署

### Heroku 部署

1. 创建 Heroku 应用
```bash
heroku create your-app-name
```

2. 设置环境变量
```bash
heroku config:set EMAIL_HOST=smtp.qq.com
heroku config:set EMAIL_PORT=587
heroku config:set EMAIL_USER=your-email@qq.com
heroku config:set EMAIL_PASS=your-authorization-code
heroku config:set RECIPIENT_EMAIL=1372943709@qq.com
heroku config:set CRON_SCHEDULE="0 8 * * *"
```

3. 部署应用
```bash
git push heroku main
```

### Vercel 部署

1. 安装 Vercel CLI
```bash
npm i -g vercel
```

2. 部署项目
```bash
vercel --prod
```

3. 在 Vercel 控制台设置环境变量

### AWS ECS 部署

1. 创建 ECS 任务定义
2. 配置环境变量
3. 启动服务
4. 设置 Application Load Balancer

## ⚙️ 邮箱配置详解

### QQ邮箱配置

1. 登录QQ邮箱
2. 进入"设置" → "账户"
3. 找到"POP3/IMAP/SMTP/Exchange/CardDAV/CalDAV服务"
4. 开启"IMAP/SMTP服务"
5. 获取授权码

配置示例：
```env
EMAIL_HOST=smtp.qq.com
EMAIL_PORT=587
EMAIL_USER=your-email@qq.com
EMAIL_PASS=your-authorization-code  # 不是QQ密码，是授权码
```

### Gmail 配置

1. 开启两步验证
2. 生成应用专用密码
3. 使用应用密码作为 EMAIL_PASS

配置示例：
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
```

### 163邮箱配置

```env
EMAIL_HOST=smtp.163.com
EMAIL_PORT=465
EMAIL_USER=your-email@163.com
EMAIL_PASS=your-authorization-code
```

## ⏰ 定时任务配置

### Cron 表达式格式

```
分 时 日 月 周
```

### 常用配置

```env
# 每天早上8点
CRON_SCHEDULE=0 8 * * *

# 每天早上9点 (工作日)
CRON_SCHEDULE=0 9 * * 1-5

# 每6小时
CRON_SCHEDULE=0 */6 * * *

# 每周一早上8点
CRON_SCHEDULE=0 8 * * 1
```

### 时区设置

系统默认使用北京时间 (Asia/Shanghai)，如需修改时区：

```javascript
// 在 src/index.js 中修改
timezone: "America/New_York"  // 纽约时间
```

## 🔧 故障排除

### 常见问题

1. **邮件发送失败**
   - 检查SMTP配置是否正确
   - 确认授权码有效
   - 检查网络连接

2. **新闻抓取失败**
   - 检查网络连接
   - 确认新闻源可访问
   - 查看错误日志

3. **定时任务不执行**
   - 检查Cron表达式格式
   - 确认服务器时区设置
   - 查看进程状态

### 日志查看

```bash
# 查看实时日志
docker-compose logs -f ai-news-mcp

# 查看最近的日志
docker-compose logs --tail=100 ai-news-mcp

# 查看特定时间的日志
docker logs ai-news-mcp --since="2024-01-01T00:00:00"
```

### 调试模式

设置环境变量启用调试：

```env
NODE_ENV=development
DEBUG=ai-news:*
```

## 🔒 安全配置

### 环境变量安全

1. 使用强密码
2. 定期更换授权码
3. 不要在代码中硬编码敏感信息

### 网络安全

1. 使用HTTPS
2. 配置防火墙
3. 限制访问权限

## 📊 监控和维护

### 健康检查

添加健康检查端点：

```javascript
// 在 src/index.js 中添加
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

### 性能监控

1. 监控内存使用
2. 监控CPU使用率
3. 监控网络请求

### 备份策略

1. 定期备份配置文件
2. 备份日志文件
3. 版本控制

## 🔄 更新和维护

### 更新依赖

```bash
# 检查过期依赖
npm outdated

# 更新依赖
npm update

# 安装最新版本
npm install package@latest
```

### 重启服务

```bash
# Docker Compose
docker-compose restart ai-news-mcp

# 纯 Docker
docker restart ai-news-mcp
```

## 📞 支持

如果遇到问题：

1. 查看日志文件
2. 检查环境变量配置
3. 确认网络连接
4. 提交 Issue 到 GitHub 仓库