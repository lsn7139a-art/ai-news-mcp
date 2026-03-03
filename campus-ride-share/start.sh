#!/bin/bash

# 校园拼车平台启动脚本
echo "🚗 启动校园拼车平台..."

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 创建必要的目录
echo "📁 创建数据目录..."
mkdir -p backend/data
mkdir -p backend/logs

# 设置权限
chmod 755 backend/data
chmod 755 backend/logs

# 停止现有容器
echo "🛑 停止现有容器..."
docker-compose down

# 构建并启动服务
echo "🔨 构建并启动服务..."
docker-compose up --build -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 初始化数据库
echo "🗄️ 初始化数据库..."
docker-compose exec backend npm run db:init

# 显示访问信息
echo ""
echo "✅ 校园拼车平台启动成功！"
echo ""
echo "🌐 访问地址："
echo "   前端应用: http://localhost:3000"
echo "   后端API:  http://localhost:3001"
echo ""
echo "📋 默认账号："
echo "   学号: 202301"
echo "   密码: 123456"
echo ""
echo "🔧 管理命令："
echo "   查看日志: docker-compose logs -f"
echo "   停止服务: docker-compose down"
echo "   重启服务: docker-compose restart"
echo ""
echo "📖 更多信息请查看 README.md"
echo ""
echo "🚗 祝您使用愉快！"