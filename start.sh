#!/bin/bash

echo "==================================="
echo "  知识库管理系统 - 快速启动"
echo "==================================="
echo ""

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: 未安装 Docker"
    echo "请先安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# 检查 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ 错误: 未安装 Docker Compose"
    echo "请先安装 Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker 环境检查通过"
echo ""

# 停止现有容器
echo "🛑 停止现有容器..."
docker-compose down 2>/dev/null

# 构建并启动服务
echo "🚀 启动服务..."
docker-compose up -d --build

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo ""
echo "📊 服务状态:"
docker-compose ps

# 初始化数据库
echo ""
echo "🔧 初始化数据库..."
docker-compose exec backend npm run seed

echo ""
echo "==================================="
echo "  ✅ 启动完成！"
echo "==================================="
echo ""
echo "📱 访问地址:"
echo "   前端:      http://localhost:3000"
echo "   后端API:   http://localhost:5000"
echo "   API文档:   http://localhost:5000/api-docs"
echo ""
echo "🔐 默认账户:"
echo "   管理员:   admin@knowledge-base.com / Admin@123"
echo "   编辑:     editor@knowledge-base.com / Editor@123"
echo "   用户:     user@knowledge-base.com / User@123"
echo ""
echo "📖 查看日志: docker-compose logs -f"
echo "🛑 停止服务: docker-compose down"
echo ""
