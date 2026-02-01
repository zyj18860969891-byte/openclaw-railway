#!/bin/bash

# OpenClaw Railway 令牌修复脚本
# 解决令牌配置问题

set -e

echo "🔧 OpenClaw Railway 令牌修复脚本"
echo "================================="

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

# 修复令牌配置
fix_token_config() {
    echo "🔧 修复令牌配置..."
    
    # 生成新的安全令牌
    NEW_TOKEN=$(openssl rand -hex 32)
    echo "生成的令牌: $NEW_TOKEN"
    
    # 更新 railway.toml 文件
    echo "更新 railway.toml 配置..."
    
    # 备份原始文件
    cp railway.toml railway.toml.backup
    
    # 更新启动命令
    sed -i "s/startCommand = \"node dist\/index.js gateway --allow-unconfigured --port 8080 --auth token --token .*/startCommand = \"node dist\/index.js gateway --allow-unconfigured --port 8080 --auth token --token $NEW_TOKEN\"/" railway.toml
    
    # 更新环境变量
    sed -i "s/OPENCLAW_GATEWAY_TOKEN = .*/OPENCLAW_GATEWAY_TOKEN = \"$NEW_TOKEN\"/" railway.toml
    
    echo "✅ 配置已更新:"
    echo "   启动命令: node dist/index.js gateway --allow-unconfigured --port 8080 --auth token --token $NEW_TOKEN"
    echo "   环境变量: OPENCLAW_GATEWAY_TOKEN=$NEW_TOKEN"
}

# 提交更改
commit_changes() {
    echo "📝 提交更改到 Git..."
    
    git add railway.toml
    git commit -m "修复令牌配置: $NEW_TOKEN"
    
    echo "✅ 更改已提交"
}

# 推送到远程仓库
push_to_remote() {
    echo "🚀 推送更改到远程仓库..."
    
    git push
    
    echo "✅ 更改已推送到远程仓库"
}

# 显示部署信息
show_deployment_info() {
    echo ""
    echo "🎉 令牌配置修复完成！"
    echo "=================================="
    echo "🔄 Railway 将自动重新部署"
    echo ""
    echo "🔑 连接令牌:"
    echo "   $NEW_TOKEN"
    echo ""
    echo "🔗 连接示例:"
    echo "   ws://your-railway-app.railway.app:8080?token=$NEW_TOKEN"
    echo ""
    echo "📋 查看部署状态:"
    echo "   railway logs"
    echo ""
    echo "🔄 重新部署命令:"
    echo "   railway up"
    echo "   railway up"
    echo ""
    echo "⚙️  配置说明："
    echo "   - 查看 RAILWAY_DEPLOYMENT.md 获取详细配置说明"
    echo "   - 编辑 .env 文件管理环境变量"
    echo "   - railway.toml 包含 Railway 特定配置"
}

# 主函数
main() {
    echo "开始令牌修复流程..."
    
    fix_token_config
    commit_changes
    push_to_remote
    show_deployment_info
    
    echo "🎊 令牌修复完成！"
}

# 运行主函数
main "$@"