# OpenClaw Railway 快速部署脚本 (Windows PowerShell)
# 基于 NotebookLM 部署指南

param(
    [switch]$SkipChecks = $false
)

Write-Host "🚀 OpenClaw Railway 快速部署脚本" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green

# 检查必要工具
function Check-Requirements {
    Write-Host "📋 检查部署要求..." -ForegroundColor Yellow
    
    # 检查 Node.js
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Host "❌ Node.js 未安装，请先安装 Node.js 18+" -ForegroundColor Red
        exit 1
    }
    
    # 检查 pnpm
    if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
        Write-Host "📦 安装 pnpm..." -ForegroundColor Yellow
        npm install -g pnpm
    }
    
    # 检查 Railway CLI
    if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
        Write-Host "🚂 安装 Railway CLI..." -ForegroundColor Yellow
        npm install -g @railway/cli
    }
    
    Write-Host "✅ 所有要求已满足" -ForegroundColor Green
}

# 安装依赖
function Install-Dependencies {
    Write-Host "📦 安装项目依赖..." -ForegroundColor Yellow
    pnpm install
    Write-Host "✅ 依赖安装完成" -ForegroundColor Green
}

# 构建项目
function Build-Project {
    Write-Host "🔨 构建项目..." -ForegroundColor Yellow
    pnpm build
    Write-Host "✅ 项目构建完成" -ForegroundColor Green
}

# 检查环境变量
function Check-Environment {
    Write-Host "🔍 检查环境变量..." -ForegroundColor Yellow
    
    if (-not (Test-Path ".env")) {
        Write-Host "⚠️  .env 文件不存在，创建示例..." -ForegroundColor Yellow
        Copy-Item ".railway.env.example" ".env"
        Write-Host "📝 请编辑 .env 文件并填入必要的环境变量" -ForegroundColor Yellow
        Write-Host "   特别是：GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, DATABASE_URL" -ForegroundColor Yellow
        Read-Host "按回车键继续..."
    }
    
    # 检查关键环境变量
    $envFile = Get-Content .env | Where-Object { $_ -match "^(GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET)=" }
    if (-not ($envFile -match "GOOGLE_CLIENT_ID=") -or -not ($envFile -match "GOOGLE_CLIENT_SECRET=")) {
        Write-Host "❌ 请在 .env 文件中设置 GOOGLE_CLIENT_ID 和 GOOGLE_CLIENT_SECRET" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ 环境变量检查完成" -ForegroundColor Green
}

# Railway 登录
function Railway-Login {
    Write-Host "🚂 Railway 登录..." -ForegroundColor Yellow
    railway login
    Write-Host "✅ Railway 登录成功" -ForegroundColor Green
}

# 部署到 Railway
function Deploy-To-Railway {
    Write-Host "🚀 部署到 Railway..." -ForegroundColor Yellow
    railway up
    Write-Host "✅ 部署完成" -ForegroundColor Green
}

# 显示部署信息
function Show-DeploymentInfo {
    Write-Host "" -ForegroundColor White
    Write-Host "🎉 部署完成！" -ForegroundColor Green
    Write-Host "==================================" -ForegroundColor Green
    Write-Host "📖 访问 Railway 控制台：" -ForegroundColor White
    Write-Host "   railway dashboard" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    Write-Host "🔗 应用地址：" -ForegroundColor White
    railway status | ForEach-Object { if ($_ -match "https://") { Write-Host "   $_" -ForegroundColor White } }
    Write-Host "" -ForegroundColor White
    Write-Host "📋 查看日志：" -ForegroundColor White
    Write-Host "   railway logs" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    Write-Host "🔄 重新部署：" -ForegroundColor White
    Write-Host "   railway up" -ForegroundColor White
    Write-Host "" -ForegroundColor White
    Write-Host "⚙️  配置说明：" -ForegroundColor White
    Write-Host "   - 查看 RAILWAY_DEPLOYMENT.md 获取详细配置说明" -ForegroundColor White
    Write-Host "   - 编辑 .env 文件管理环境变量" -ForegroundColor White
    Write-Host "   - railway.toml 包含 Railway 特定配置" -ForegroundColor White
}

# 主函数
function Main {
    Write-Host "开始部署流程..." -ForegroundColor Yellow
    
    if (-not $SkipChecks) {
        Check-Requirements
    }
    
    Install-Dependencies
    Build-Project
    Check-Environment
    Railway-Login
    Deploy-To-Railway
    Show-DeploymentInfo
    
    Write-Host "🎊 所有步骤完成！" -ForegroundColor Green
}

# 运行主函数
Main