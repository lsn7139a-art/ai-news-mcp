# 🚀 AI新闻系统 - GitHub部署步骤

## 📋 部署状态
✅ Git仓库已初始化  
✅ 代码已提交到本地仓库  
⏳ 等待推送到GitHub  

## 🎯 接下来的步骤（3分钟完成）

### 步骤1: 创建GitHub仓库
1. 访问 [GitHub.com](https://github.com)
2. 点击右上角的 "+" → "New repository"
3. 仓库名称: `ai-news-mcp`
4. 描述: `AI新闻自动化推送系统`
5. 选择 "Public" (免费)
6. **不要**勾选 "Add a README file" (我们已经有了)
7. 点击 "Create repository"

### 步骤2: 推送代码到GitHub
创建仓库后，GitHub会显示推送命令。复制以下命令到终端执行：

```bash
# 如果您在ai-news-mcp目录中，直接执行：
git remote add origin https://github.com/YOUR_USERNAME/ai-news-mcp.git
git branch -M main
git push -u origin main

# 请将 YOUR_USERNAME 替换为您的GitHub用户名
```

### 步骤3: 配置GitHub Secrets
1. 进入您的GitHub仓库页面
2. 点击 "Settings" 标签
3. 左侧菜单点击 "Secrets and variables" → "Actions"
4. 点击 "New repository secret"
5. 添加以下5个Secrets：

| Secret名称 | 值 | 说明 |
|-----------|-----|------|
| `EMAIL_HOST` | `smtp.gmail.com` | Gmail SMTP服务器 |
| `EMAIL_PORT` | `587` | SMTP端口 |
| `EMAIL_USER` | `您的邮箱@gmail.com` | 发送邮箱 |
| `EMAIL_PASS` | `您的应用密码` | Gmail应用密码 |
| `RECIPIENT_EMAIL` | `1372943709@qq.com` | 接收邮箱 |

### 步骤4: 获取Gmail应用密码
1. 访问 [Google账户设置](https://myaccount.google.com/)
2. 安全性 → 两步验证（必须开启）
3. 应用密码 → 生成新密码
4. 选择"邮件"和设备，复制生成的16位密码

### 步骤5: 测试系统
1. 在GitHub仓库点击 "Actions" 标签
2. 选择 "Send AI News" 工作流
3. 点击 "Run workflow" → "Run workflow" 手动测试
4. 检查是否收到邮件

## 🎉 完成！
配置完成后，系统将：
- 每天早上8点自动发送AI新闻
- 自动处理和分类新闻
- 按您要求的格式推送

## 📞 需要帮助？
如果遇到问题，请检查：
1. GitHub Secrets是否正确配置
2. Gmail应用密码是否正确
3. Actions工作流是否正常运行

## 🔄 自动化状态
- ✅ 代码已准备就绪
- ✅ GitHub Actions已配置
- ✅ 邮件模板已优化
- ⏳ 等待您的GitHub推送和配置