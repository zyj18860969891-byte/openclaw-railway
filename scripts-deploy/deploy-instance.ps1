# OpenClaw 实例部署脚本 - PowerShell 版本
# 用法: .\deploy-instance.ps1 -InstanceName <实例名称>

param(
    [Parameter(Mandatory=$true)]
    [string]$InstanceName
)

$ErrorActionPreference = "Stop"

$InstanceDir = "instances\$InstanceName"

Write-Host "=== 部署实例: $InstanceName ===" -ForegroundColor Cyan

# 检查实例目录是否存在
if (-not (Test-Path $InstanceDir)) {
    Write-Host "❌ 实例不存在: $InstanceName" -ForegroundColor Red
    Write-Host "请先创建实例: .\scripts-deploy\create-instance.ps1"
    exit 1
}

# 检查必要文件
$requiredFiles = @("railway.toml", ".env", "Dockerfile.railway")
foreach ($file in $requiredFiles) {
    if (-not (Test-Path "$InstanceDir\$file")) {
        Write-Host "❌ 缺少必要文件: $InstanceDir\$file" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ 检查通过，所有必要文件存在" -ForegroundColor Green

# 进入实例目录
Set-Location $InstanceDir

# 检查 Railway CLI
Write-Host ""
Write-Host "检查 Railway CLI..." -ForegroundColor Yellow

try {
    $railwayVersion = railway --version 2>&1
    Write-Host "✅ Railway CLI 已安装: $railwayVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI 未安装" -ForegroundColor Red
    Write-Host "请先安装: npm install -g @railway/cli"
    exit 1
}

# 检查登录状态
Write-Host ""
Write-Host "检查 Railway 登录状态..." -ForegroundColor Yellow

try {
    $whoami = railway whoami 2>&1
    Write-Host "✅ 已登录: $whoami" -ForegroundColor Green
} catch {
    Write-Host "⚠️ 未登录，请先登录..." -ForegroundColor Yellow
    railway login
}

# 检查项目是否存在
Write-Host ""
Write-Host "检查 Railway 项目..." -ForegroundColor Yellow

$projectExists = $false
try {
    $status = railway status 2>&1
    if ($status -match $InstanceName) {
        $projectExists = $true
        Write-Host "✅ 项目已存在: $InstanceName" -ForegroundColor Green
    }
} catch {
    # 项目不存在
}

if (-not $projectExists) {
    Write-Host "创建新 Railway 项目: $InstanceName" -ForegroundColor Yellow
    railway init --name $InstanceName
    Write-Host "✅ 项目已创建" -ForegroundColor Green
}

# 读取环境变量并设置
Write-Host ""
Write-Host "设置环境变量..." -ForegroundColor Yellow

$envContent = Get-Content ".env" | Where-Object { $_ -match "^[A-Z_]+=" -and $_ -notmatch "^#" }
foreach ($line in $envContent) {
    $parts = $line -split "=", 2
    if ($parts.Length -eq 2) {
        $key = $parts[0].Trim()
        $value = $parts[1].Trim() -replace '^"|"$', ''
        if ($value -and $value -ne "{{" + $key + "}}") {
            Write-Host "  设置: $key" -ForegroundColor Gray
            railway variables set "$key=$value" 2>&1 | Out-Null
        }
    }
}

Write-Host "✅ 环境变量已设置" -ForegroundColor Green

# 部署
Write-Host ""
Write-Host "开始部署..." -ForegroundColor Yellow
Write-Host ""

railway up

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== 部署成功 ===" -ForegroundColor Cyan
    Write-Host ""
    
    # 获取域名
    try {
        $domain = railway domain 2>&1
        if ($domain) {
            Write-Host "🌐 服务地址: https://$domain" -ForegroundColor Green
        }
    } catch {
        Write-Host "🌐 请在 Railway Dashboard 查看服务地址" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "📋 常用命令:" -ForegroundColor Yellow
    Write-Host "  查看日志: railway logs --follow"
    Write-Host "  打开控制台: railway open"
    Write-Host "  重启服务: railway restart"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ 部署失败，请检查日志" -ForegroundColor Red
    Write-Host "  查看日志: railway logs"
}

# 返回原目录
Set-Location ..
