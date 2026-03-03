# 📋 Git命令使用详细指南

## 🎯 这些命令的作用

```bash
git remote add origin https://github.com/YOUR_USERNAME/ai-news-mcp.git
git branch -M main
git push -u origin main
```

### 命令解释：

1. **`git remote add origin`** - 添加远程仓库地址
   - `origin` 是远程仓库的别名
   - `https://github.com/YOUR_USERNAME/ai-news-mcp.git` 是您在GitHub上的仓库地址

2. **`git branch -M main`** - 设置主分支名为main
   - `-M` 表示重命名/移动分支
   - `main` 是现在GitHub默认的主分支名

3. **`git push -u origin main`** - 推送代码到GitHub
   - `-u` 设置上游分支，下次可以直接用 `git push`
   - `origin` 推送到别名为origin的远程仓库
   - `main` 推送main分支

## 🔧 使用步骤

### 步骤1: 获取您的GitHub用户名
1. 登录 [GitHub.com](https://github.com)
2. 点击右上角头像
3. 查看您的用户名（通常是 @username 的形式）

### 步骤2: 创建GitHub仓库
1. 点击右上角的 "+" → "New repository"
2. 仓库名称: `ai-news-mcp`
3. 描述: `AI新闻自动化推送系统`
4. 选择 Public
5. **不要**勾选任何初始化选项
6. 点击 "Create repository"

### 步骤3: 执行Git命令（3种方法）

#### 方法1: 直接在终端执行（推荐）
```bash
# 将 YOUR_USERNAME 替换为您的实际用户名
git remote add origin https://github.com/您的用户名/ai-news-mcp.git
git branch -M main
git push -u origin main
```

#### 方法2: 我帮您执行
如果您告诉我GitHub用户名，我可以帮您执行这些命令。

#### 方法3: 使用GitHub提供的命令
创建仓库后，GitHub会显示类似的命令，直接复制粘贴执行即可。

## 📝 示例

假设您的GitHub用户名是 `zhangsan`，那么命令应该是：

```bash
git remote add origin https://github.com/zhangsan/ai-news-mcp.git
git branch -M main
git push -u origin main
```

## ⚠️ 注意事项

1. **替换用户名** - 必须将 `YOUR_USERNAME` 替换为您的实际用户名
2. **先创建仓库** - 必须先在GitHub上创建仓库，否则推送会失败
3. **网络连接** - 确保能正常访问GitHub
4. **权限** - 确保您有该仓库的推送权限

## 🆘 遇到问题？

### 错误: "remote origin already exists"
```bash
# 解决方法：先删除现有的origin，再添加
git remote remove origin
git remote add origin https://github.com/您的用户名/ai-news-mcp.git
```

### 错误: "Authentication failed"
```bash
# 可能需要配置GitHub凭据或使用Personal Access Token
```

### 错误: "repository not found"
```bash
# 检查仓库名称和用户名是否正确
```

## 🎉 成功标志
执行成功后，您会看到类似输出：
```
Enumerating objects: 108, done.
Counting objects: 100% (108/108), done.
...
To https://github.com/您的用户名/ai-news-mcp.git
 * [new branch]      main -> main
```

然后访问您的GitHub仓库页面，就能看到所有文件了！