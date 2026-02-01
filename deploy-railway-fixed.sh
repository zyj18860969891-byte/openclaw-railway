#!/bin/bash

# OpenClaw Railway 部署脚本 - 修复版本
# 这个脚本解决了 Railway 部署中的常见问题

echo "🚀 开始 OpenClaw Railway 部署..."

# 检查 Railway CLI 是否已安装
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI 未安装，请先安装："
    echo "   npm install -g @railway/cli"
    exit 1
fi

# 检查是否已登录 Railway
if ! railway whoami &> /dev/null; then
    echo "🔑 请先登录 Railway："
    echo "   railway login"
    exit 1
fi

# 检查 pnpm-lock.yaml 是否存在
if [ ! -f "pnpm-lock.yaml" ]; then
    echo "❌ pnpm-lock.yaml 文件不存在，请先运行："
    echo "   pnpm install"
    exit 1
fi

# 检查 railway.toml 是否存在
if [ ! -f "railway.toml" ]; then
    echo "❌ railway.toml 文件不存在"
    exit 1
fi

# 检查 Dockerfile 是否存在
if [ ! -f "Dockerfile" ]; then
    echo "❌ Dockerfile 文件不存在"
    exit 1
fi

echo "✅ 所有必需文件都存在"

# 检查 Railway 配置
echo "📋 检查 Railway 配置..."
if grep -q "type = \"node\"" railway.toml; then
    echo "⚠️  检测到旧的 Railway 配置，正在修复..."
    sed -i 's/type = "node"/builder = "dockerfile"/' railway.toml
    sed -i 's/dockerfilePath = ""/dockerfilePath = "Dockerfile"/' railway.toml
    echo "✅ 已修复 Railway 配置"
fi

# 检查端口配置
echo "📋 检查端口配置..."
if grep -q 'PORT = "3000"' railway.toml; then
    echo "⚠️  检测到端口配置不正确，正在修复..."
    sed -i 's/PORT = "3000"/PORT = "8080"/' railway.toml
    sed -i 's/internalPort = 3000/internalPort = 8080/' railway.toml
    echo "✅ 已修复端口配置"
fi

# 检查 Dockerfile 端口暴露
if ! grep -q "EXPOSE 8080" Dockerfile; then
    echo "⚠️  检测到 Dockerfile 缺少端口暴露，正在修复..."
    sed -i '/WORKDIR \/app/a\\n# Expose port 8080 for Railway\nEXPOSE 8080' Dockerfile
    echo "✅ 已修复 Dockerfile 端口配置"
fi

# 检查 .dockerignore 是否排除 pnpm-lock.yaml
if grep -q "pnpm-lock.yaml" .dockerignore && ! grep -q "!pnpm-lock.yaml" .dockerignore; then
    echo "⚠️  检测到 .dockerignore 排除了 pnpm-lock.yaml，正在修复..."
    echo "# Railway specific exclusions\n# Don't exclude pnpm-lock.yaml as it's required for Railway builds\n!pnpm-lock.yaml" >> .dockerignore
    echo "✅ 已修复 .dockerignore 配置"
fi

echo "🔧 所有配置已修复"

# 推送代码到 GitHub（如果使用 GitHub 部署）
if [ -d ".git" ]; then
    echo "📤 推送代码到 GitHub..."
    git add .
    git commit -m "Fix Railway deployment configuration"
    git push origin main
    echo "✅ 代码已推送"
fi

echo "🚀 开始 Railway 部署..."
railway up

echo "🎉 部署完成！"
echo ""
echo "📋 下一步："
echo "1. 在 Railway 控制台中启用 HTTP Proxy（端口 8080）"
echo "2. 添加 Volume（挂载到 /data）"
echo "3. 设置环境变量（至少 SETUP_PASSWORD）"
echo "4. 访问 https://<your-domain>/setup 进行设置"