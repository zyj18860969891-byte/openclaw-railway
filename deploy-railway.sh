#!/bin/bash

# OpenClaw Railway 快速部署脚本
# 基于 NotebookLM 部署指南

set -e

echo "🚀 OpenClaw Railway 快速部署脚本"
echo "=================================="

# 检查必要工具
check_requirements() {
    echo "📋 检查部署要求..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js 未安装，请先安装 Node.js 18+"
        exit 1
    fi
    
    # 检查 pnpm
    if ! command -v pnpm &> /dev/null; then
        echo "📦 安装 pnpm..."
        npm install -g pnpm
    fi
    
    # 检查 Railway CLI
    if ! command -v railway &> /dev/null; then
        echo "🚂 安装 Railway CLI..."
        npm install -g @railway/cli
    fi
    
    echo "✅ 所有要求已满足"
}

# 安装依赖
install_dependencies() {
    echo "📦 安装项目依赖..."
    pnpm install
    echo "✅ 依赖安装完成"
}

# 构建项目
build_project() {
    echo "🔨 构建项目..."
    pnpm build
    echo "✅ 项目构建完成"
}

# 检查环境变量
check_env() {
    echo "🔍 检查环境变量..."
    
    if [ ! -f ".env" ]; then
        echo "⚠️  .env 文件不存在，创建示例..."
        cp .railway.env.example .env
        echo "📝 请编辑 .env 文件并填入必要的环境变量"
        echo "   特别是：GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, DATABASE_URL"
        read -p "按回车键继续..."
    fi
    
    # 检查关键环境变量
    source .env
    if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
        echo "❌ 请在 .env 文件中设置 GOOGLE_CLIENT_ID 和 GOOGLE_CLIENT_SECRET"
        exit 1
    fi
    
    echo "✅ 环境变量检查完成"
}

# Railway 登录
railway_login() {
    echo "🚂 Railway 登录..."
    railway login
    echo "✅ Railway 登录成功"
}

# 部署到 Railway
deploy_to_railway() {
    echo "🚀 部署到 Railway..."
    railway up
    echo "✅ 部署完成"
}

# 显示部署信息
show_deployment_info() {
    echo ""
    echo "🎉 部署完成！"
    echo "=================================="
    echo "📖 访问 Railway 控制台："
    echo "   railway dashboard"
    echo ""
    echo "🔗 应用地址："
    echo "   $(railway status | grep -o 'https://[^ ]*')"
    echo ""
    echo "📋 查看日志："
    echo "   railway logs"
    echo ""
    echo "🔄 重新部署："
    echo "   railway up"
    echo ""
    echo "⚙️  配置说明："
    echo "   - 查看 RAILWAY_DEPLOYMENT.md 获取详细配置说明"
    echo "   - 编辑 .env 文件管理环境变量"
    echo "   - railway.toml 包含 Railway 特定配置"
}

# 主函数
main() {
    echo "开始部署流程..."
    
    check_requirements
    install_dependencies
    build_project
    check_env
    railway_login
    deploy_to_railway
    show_deployment_info
    
    echo "🎊 所有步骤完成！"
}

# 运行主函数
main "$@"