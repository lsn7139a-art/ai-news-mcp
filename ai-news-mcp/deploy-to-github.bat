@echo off
echo 🚀 AI新闻系统 - GitHub部署助手
echo =====================================
echo.

REM 检查是否提供了用户名
if "%1"=="" (
    echo ❌ 错误：请提供您的GitHub用户名
    echo.
    echo 使用方法：
    echo   deploy-to-github.bat YOUR_GITHUB_USERNAME
    echo.
    echo 示例：
    echo   deploy-to-github.bat zhangsan
    echo.
    pause
    exit /b 1
)

set GITHUB_USERNAME=%1
echo 🔗 使用GitHub用户名: %GITHUB_USERNAME%
echo.

REM 检查当前目录
if not exist "package.json" (
    echo ❌ 错误：请在ai-news-mcp目录中运行此脚本
    pause
    exit /b 1
)

echo 📋 步骤1/3: 添加远程仓库...
git remote add origin https://github.com/%GITHUB_USERNAME%/ai-news-mcp.git
if errorlevel 1 (
    echo ⚠️  远程仓库可能已存在，尝试重新配置...
    git remote remove origin
    git remote add origin https://github.com/%GITHUB_USERNAME%/ai-news-mcp.git
)

echo ✅ 远程仓库已添加
echo.

echo 📋 步骤2/3: 设置主分支...
git branch -M main
echo ✅ 主分支已设置为main
echo.

echo 📋 步骤3/3: 推送代码到GitHub...
echo 🔄 正在推送代码，请稍候...
git push -u origin main

if errorlevel 1 (
    echo.
    echo ❌ 推送失败！请检查：
    echo   1. 您的GitHub用户名是否正确
    echo   2. 是否已在GitHub上创建了ai-news-mcp仓库
    echo   3. 是否有推送权限
    echo   4. 网络连接是否正常
    echo.
    echo 🔧 请先在GitHub上创建仓库：
    echo   https://github.com/new
    echo   仓库名称: ai-news-mcp
    echo   选择Public
    echo   不要勾选初始化选项
    echo.
    pause
    exit /b 1
)

echo.
echo 🎉 部署成功！
echo.
echo 📂 您的仓库地址：https://github.com/%GITHUB_USERNAME%/ai-news-mcp
echo.
echo 📋 下一步：
echo   1. 访问您的仓库页面
echo   2. 进入 Settings → Secrets and variables → Actions
echo   3. 添加5个Secrets（查看DEPLOYMENT_STEPS.md）
echo   4. 测试GitHub Actions
echo.
echo 📖 详细指南请查看：DEPLOYMENT_STEPS.md
echo.
pause