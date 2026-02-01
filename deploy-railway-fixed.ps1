# OpenClaw Railway 部署脚本 - 修复版本 (PowerShell)
# 这个脚本解决了 Railway 部署中的常见问题

Write-Host "🚀 开始 OpenClaw Railway 部署..." -ForegroundColor Green

# 检查 Railway CLI 是否已安装
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI 未安装，请先安装：" -ForegroundColor Red
    Write-Host "   npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

# 检查是否已登录 Railway
$railwayWhoami = railway whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "🔑 请先登录 Railway：" -ForegroundColor Yellow
    Write-Host "   railway login" -ForegroundColor Yellow
    exit 1
}

# 检查 pnpm-lock.yaml 是否存在
if (-not (Test-Path "pnpm-lock.yaml")) {
    Write-Host "❌ pnpm-lock.yaml 文件不存在，请先运行：" -ForegroundColor Red
    Write-Host "   pnpm install" -ForegroundColor Yellow
    exit 1
}

# 检查 railway.toml 是否存在
if (-not (Test-Path "railway.toml")) {
    Write-Host "❌ railway.toml 文件不存在" -ForegroundColor Red
    exit 1
}

# 检查 Dockerfile 是否存在
if (-not (Test-Path "Dockerfile")) {
    Write-Host "❌ Dockerfile 文件不存在" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 所有必需文件都存在" -ForegroundColor Green

# 检查 Railway 配置
Write-Host "📋 检查 Railway 配置..." -ForegroundColor Cyan
$railwayConfig = Get-Content "railway.toml" -Raw
if ($railwayConfig -match 'type = "node"') {
    Write-Host "⚠️  检测到旧的 Railway 配置，正在修复..." -ForegroundColor Yellow
    $railwayConfig = $railwayConfig -replace 'type = "node"', 'builder = "dockerfile"'
    $railwayConfig = $railwayConfig -replace 'dockerfilePath = ""', 'dockerfilePath = "Dockerfile"'
    Set-Content "railway.toml" -Value $railwayConfig
    Write-Host "✅ 已修复 Railway 配置" -ForegroundColor Green
}

# 检查端口配置
Write-Host "📋 检查端口配置..." -ForegroundColor Cyan
if ($railwayConfig -match 'PORT = "3000"') {
    Write-Host "⚠️  检测到端口配置不正确，正在修复..." -ForegroundColor Yellow
    $railwayConfig = $railwayConfig -replace 'PORT = "3000"', 'PORT = "8080"'
    $railwayConfig = $railwayConfig -replace 'internalPort = 3000', 'internalPort = 8080'
    Set-Content "railway.toml" -Value $railwayConfig
    Write-Host "✅ 已修复端口配置" -ForegroundColor Green
}

# 检查 Dockerfile 端口暴露
$dockerfile = Get-Content "Dockerfile" -Raw
if ($dockerfile -notmatch "EXPOSE 8080") {
    Write-Host "⚠️  检测到 Dockerfile 缺少端口暴露，正在修复..." -ForegroundColor Yellow
    $dockerfile = $dockerfile -replace "WORKDIR /app", "WORKDIR /app`n`n# Expose port 8080 for Railway`nEXPOSE 8080"
    Set-Content "Dockerfile" -Value $dockerfile
    Write-Host "✅ 已修复 Dockerfile 端口配置" -ForegroundColor Green
}

# 检查 .dockerignore 是否排除 pnpm-lock.yaml
$dockerignore = Get-Content ".dockerignore" -Raw
if ($dockerignore -match "pnpm-lock.yaml" -and $dockerignore -notmatch "!pnpm-lock.yaml") {
    Write-Host "⚠️  检测到 .dockerignore 排除了 pnpm-lock.yaml，正在修复..." -ForegroundColor Yellow
    Add-Content ".dockerignore" -Value "`n# Railway specific exclusions`n# Don't exclude pnpm-lock.yaml as it's required for Railway builds`n!pnpm-lock.yaml"
    Write-Host "✅ 已修复 .dockerignore 配置" -ForegroundColor Green
}

Write-Host "🔧 所有配置已修复" -ForegroundColor Green

# 推送代码到 GitHub（如果使用 GitHub 部署）
if (Test-Path ".git") {
    Write-Host "📤 推送代码到 GitHub..." -ForegroundColor Cyan
    git add .
    git commit -m "Fix Railway deployment configuration"
    git push origin main
    Write-Host "✅ 代码已推送" -ForegroundColor Green
}

Write-Host "🚀 开始 Railway 部署..." -ForegroundColor Green
railway up

Write-Host "🎉 部署完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📋 下一步：" -ForegroundColor Cyan
Write-Host "1. 在 Railway 控制台中启用 HTTP Proxy（端口 8080）" -ForegroundColor Yellow
Write-Host "2. 添加 Volume（挂载到 /data）" -ForegroundColor Yellow
Write-Host "3. 设置环境变量（至少 SETUP_PASSWORD）" -ForegroundColor Yellow
Write-Host "4. 访问 https://<your-domain>/setup 进行设置" -ForegroundColor Yellow