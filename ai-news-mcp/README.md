# AI 新闻 MCP 服务器

这是一个专为「人工智能与大模型行业」设计的自动化新闻收集和分析系统，使用 MCP (Model Context Protocol) 构建。

## 🌟 功能特性

- 🤖 **智能新闻收集** - 自动收集过去24小时内AI与大模型行业重要新闻
- 📊 **智能分类分析** - 按大型科技公司、技术进展、政策监管、融资并购等主题分类
- 📧 **精美邮件推送** - 按用户要求的格式生成专业的行业日报
- 🎯 **关键影响总结** - 自动分析当日新闻对行业的最关键影响
- ⏰ **定时推送** - 每天早上8点自动推送到指定邮箱
- 🌐 **多源覆盖** - 覆盖主要AI公司官方博客和专业科技媒体
- 🚀 **GitHub Actions自动化** - 无需电脑24小时运行，完全免费

## 📧 邮件格式说明

系统会按照以下格式发送AI与大模型行业日报：

### 📈 今日重要新闻 (5-10条)
- 标题 + 一句话摘要
- 新闻来源和重要性评分

### 🔍 主题分类分析
- 🏢 大型科技公司 (OpenAI、Google、Meta等)
- 🧠 大模型技术进展 (GPT、Claude、Gemini等)
- ⚖️ 政策监管动态 (重要政策和法规变化)
- 💰 大额融资与并购 (行业投资活动)
- 👨‍💻 开发者功能更新 (API和工具更新)

### 🎯 今日关键影响总结 (3-5条)
- 分析当日新闻对行业的最关键影响

## 🚀 快速开始

### 方法一：GitHub Actions自动化部署（推荐生产环境）🌟

这是最佳方案，无需电脑24小时运行，完全免费！

1. **推送代码到 GitHub**
   ```bash
   git add .
   git commit -m "Add AI news system"
   git branch -M main
   git remote add origin https://github.com/your-username/ai-news-mcp.git
   git push -u origin main
   ```

2. **配置 GitHub Secrets**
   - 进入仓库 `Settings` → `Secrets and variables` → `Actions`
   - 添加以下 Secrets：
     - `EMAIL_HOST`: SMTP服务器（如 smtp.gmail.com）
     - `EMAIL_PORT`: SMTP端口（如 587）
     - `EMAIL_USER`: 发送邮箱
     - `EMAIL_PASS`: 邮箱密码/应用密码
     - `RECIPIENT_EMAIL`: 接收邮箱（1372943709@qq.com）

3. **完成部署**
   - 系统将每天早上8点自动推送
   - 可在 Actions 页面手动测试

📖 **详细部署指南**: 查看 [GITHUB_ACTIONS_GUIDE.md](./GITHUB_ACTIONS_GUIDE.md)

### 方法二：本地运行（推荐测试）

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd ai-news-mcp
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，设置您的邮箱配置
   ```

4. **启动服务**
   ```bash
   # 测试运行
   npm run test
   
   # 正式运行
   npm start
   ```

## 🛠️ MCP 工具说明

### get_latest_ai_news
获取最新的AI与大模型行业新闻
- 参数: `limit` (可选) - 返回新闻数量限制，默认 10

### get_tech_news  
获取科技新闻 (已废弃，整合到主新闻流中)
- 参数: `limit` (可选) - 返回新闻数量限制，默认 5

### send_news_email
立即发送AI与大模型行业日报
- 参数: `recipient` (可选) - 接收邮箱地址，默认为环境变量配置

### schedule_news_email
设置定时发送日报
- 参数: `schedule` (可选) - Cron表达式，默认每天早上8点 (`0 8 * * *`)

## 📰 新闻源覆盖

### 🏢 主要AI公司官方博客
- OpenAI Blog
- DeepMind Blog
- Google AI Blog
- Meta AI Blog
- Anthropic Blog

### 📰 专业AI新闻媒体
- VentureBeat AI
- Ars Technica AI
- MIT Technology Review AI

### 🌐 综合科技媒体AI版块
- TechCrunch AI
- The Verge AI
- Wired AI

## 🐳 Docker 部署

```bash
# 构建镜像
docker build -t ai-news-mcp .

# 运行容器
docker run -d \
  --env-file .env \
  --name ai-news-mcp \
  ai-news-mcp
```

## 🔄 自动化部署

项目配置了完整的 GitHub Actions 工作流：
- 🤖 **定时推送** - 每天8点自动发送AI新闻
- 🧪 **CI/CD** - 自动测试和构建
- 🐳 **Docker** - 自动构建和推送Docker镜像
- 🚀 **部署** - 自动部署到生产环境

## 📊 智能特性

- **新闻重要性评分** - 基于关键词和来源自动评分
- **时间过滤** - 只推送过去24小时内的新闻
- **重复检测** - 避免推送重复内容
- **趋势分析** - 分析各主题活跃度
- **智能摘要** - 自动生成关键信息摘要

## 📝 使用示例

### 手动发送新闻邮件

```bash
# MCP调用示例
{
  "name": "send_news_email",
  "arguments": {
    "recipient": "your-email@example.com"
  }
}
```

### 设置定时任务

```bash
# 设置每天早上8点推送
{
  "name": "schedule_news_email", 
  "arguments": {
    "schedule": "0 8 * * *"
  }
}

# 设置工作日早上9点推送
{
  "name": "schedule_news_email",
  "arguments": {
    "schedule": "0 9 * * 1-5"
  }
}
```

## ⚠️ 注意事项

1. **邮箱配置** - 确保SMTP服务已正确配置，QQ邮箱需要开启SMTP服务并获取授权码
2. **网络环境** - 部分新闻源可能需要代理访问
3. **定时任务** - 确保服务器时区设置为北京时间 (Asia/Shanghai)
4. **新闻质量** - 系统会自动过滤低质量或重复新闻

## 🎯 部署建议

| 需求 | 推荐方案 | 优势 |
|------|----------|------|
| 生产环境 | GitHub Actions | 免费稳定、无需维护 |
| 开发测试 | 本地运行 | 快速调试、实时反馈 |
| 企业部署 | Docker | 容器化、易于扩展 |

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 📄 许可证

MIT License