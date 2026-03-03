# GitHub Actions 自动化部署指南

## 🚀 GitHub Actions 部署方案

使用 GitHub Actions 可以实现完全自动化的 AI 新闻推送，无需电脑24小时运行。

### 📋 部署步骤

#### 1. 推送代码到 GitHub

```bash
git add .
git commit -m "Add AI news system with GitHub Actions"
git branch -M main
git remote add origin https://github.com/your-username/ai-news-mcp.git
git push -u origin main
```

#### 2. 配置 GitHub Secrets

在 GitHub 仓库中设置以下 Secrets：

1. 进入仓库页面
2. 点击 `Settings` → `Secrets and variables` → `Actions`
3. 点击 `New repository secret`

需要设置的 Secrets：

| Secret 名称 | 值 | 说明 |
|------------|-----|------|
| `EMAIL_HOST` | smtp.gmail.com | 邮箱SMTP服务器 |
| `EMAIL_PORT` | 587 | SMTP端口 |
| `EMAIL_USER` | your-email@gmail.com | 发送邮箱 |
| `EMAIL_PASS` | your-app-password | 邮箱密码/应用密码 |
| `RECIPIENT_EMAIL` | 1372943709@qq.com | 接收邮箱 |

#### 3. 邮箱配置说明

**Gmail 配置：**
1. 启用两步验证
2. 生成应用密码：https://myaccount.google.com/apppasswords
3. 使用应用密码作为 `EMAIL_PASS`

**QQ邮箱配置：**
1. SMTP服务器: `smtp.qq.com`
2. 端口: `587`
3. 需要开启SMTP服务并获取授权码

**其他邮箱配置：**
- 163邮箱: `smtp.163.com:587`
- Outlook: `smtp-mail.outlook.com:587`

#### 4. 验证部署

GitHub Actions 工作流会在以下情况自动运行：

1. **定时执行**: 每天UTC 00:00 (北京时间早上8点)
2. **手动触发**: 在 Actions 页面手动运行

### 📊 监控和管理

#### 查看运行状态
1. 进入仓库的 `Actions` 页面
2. 查看 `AI News Scheduler` 工作流
3. 检查运行日志和结果

#### 手动测试
1. 在 Actions 页面点击 `AI News Scheduler`
2. 点击 `Run workflow`
3. 选择分支并运行

#### 故障排查
- 检查 Secrets 配置是否正确
- 查看工作流日志中的错误信息
- 确认邮箱服务配置正确

### ⚙️ 高级配置

#### 修改推送时间
编辑 `.github/workflows/news-scheduler.yml`:

```yaml
schedule:
  - cron: '0 0 * * *'  # UTC 00:00 = 北京时间 08:00
```

#### 添加更多触发条件
```yaml
on:
  schedule:
    - cron: '0 0 * * *'
  workflow_dispatch:
  push:
    branches: [ main ]
```

### 🔧 工作流特性

✅ **完全自动化**: 无需人工干预  
✅ **定时推送**: 每天8点准时推送  
✅ **手动触发**: 支持测试和即时推送  
✅ **错误处理**: 失败时自动通知  
✅ **日志记录**: 详细的运行日志  
✅ **安全性**: 邮箱信息加密存储  

### 📈 运行成本

- **免费额度**: GitHub Actions 免费额度足够
- **运行时间**: 每次约2-3分钟
- **月度成本**: 完全免费

### 🎯 部署优势

相比本地运行，GitHub Actions 方案具有以下优势：

1. **高可靠性**: GitHub 服务器稳定运行
2. **无需维护**: 不需要维护服务器
3. **自动部署**: 代码更新自动生效
4. **全球可用**: 不受地域限制
5. **完全免费**: 无需额外成本

---

## 🎉 部署完成！

按照以上步骤完成后，您的 AI 新闻系统将：

- 每天早上8点自动推送 AI 行业新闻
- 推送到指定的邮箱地址
- 无需任何人工干预
- 完全免费运行

现在您可以享受每天准时收到高质量 AI 新闻的便利了！