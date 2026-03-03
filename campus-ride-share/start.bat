@echo off
chcp 65001 >nul
echo 🚗 启动校园拼车平台...

REM 检查Docker是否安装
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker未安装，请先安装Docker
    pause
    exit /b 1
)

docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose未安装，请先安装Docker Compose
    pause
    exit /b 1
)

REM 创建必要的目录
echo 📁 创建数据目录...
if not exist backend\data mkdir backend\data
if not exist backend\logs mkdir backend\logs

REM 停止现有容器
echo 🛑 停止现有容器...
docker-compose down

REM 构建并启动服务
echo 🔨 构建并启动服务...
docker-compose up --build -d

REM 等待服务启动
echo ⏳ 等待服务启动...
timeout /t 10 /nobreak >nul

REM 检查服务状态
echo 🔍 检查服务状态...
docker-compose ps

REM 初始化数据库
echo 🗄️ 初始化数据库...
docker-compose exec backend npm run db:init

REM 显示访问信息
echo.
echo ✅ 校园拼车平台启动成功！
echo.
echo 🌐 访问地址：
echo    前端应用: http://localhost:3000
echo    后端API:  http://localhost:3001
echo.
echo 📋 默认账号：
echo    学号: 202301
echo    密码: 123456
echo.
echo 🔧 管理命令：
echo    查看日志: docker-compose logs -f
echo    停止服务: docker-compose down
echo    重启服务: docker-compose restart
echo.
echo 📖 更多信息请查看 README.md
echo.
echo 🚗 祝您使用愉快！
pause