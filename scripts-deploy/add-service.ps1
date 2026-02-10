# OpenClaw 同项目多服务部署脚本
# 在同一个 Railway 项目中添加新服务，共享 volume
# 用法: .\add-service.ps1 -ServiceName <服务名称> [-ChannelConfig <JSON配置>]

param(
    [Parameter(Mandatory=$true)]
    [string]$ServiceName,
    
    [string]$ChannelConfig = "{}",
    
    [string]$ModelName = "openrouter/stepfun/step-3.5-flash:free"
)

$ErrorActionPreference = "Stop"

Write-Host "=== 在 openclaw-railway 项目中添加新服务 ===" -ForegroundColor Cyan
Write-Host "服务名称: $ServiceName"
Write-Host ""

# 检查当前项目
Write-Host "检查当前项目..." -ForegroundColor Yellow
$status = railway status 2>&1
Write-Host $status

if ($status -notmatch "openclaw-railway") {
    Write-Host "❌ 请确保在 openclaw-railway 项目目录中运行此脚本" -ForegroundColor Red
    exit 1
}

# 创建服务目录
$serviceDir = "services\$ServiceName"
if (Test-Path $serviceDir) {
    Write-Host "❌ 服务目录已存在: $serviceDir" -ForegroundColor Red
    exit 1
}

New-Item -ItemType Directory -Path $serviceDir -Force | Out-Null
Write-Host "✅ 创建服务目录: $serviceDir" -ForegroundColor Green

# 复制必要文件
Copy-Item "Dockerfile.railway" "$serviceDir\Dockerfile.railway"
Copy-Item "fix-plugin-config.sh" "$serviceDir\fix-plugin-config.sh"
Copy-Item "package.json" "$serviceDir\package.json"
Write-Host "✅ 复制必要文件" -ForegroundColor Green

# 创建服务专属的 railway.toml
$railwayToml = @"
# OpenClaw 服务配置 - $ServiceName

[build]
  builder = "dockerfile"
  dockerfilePath = "Dockerfile.railway"
  context = "."

[deploy]
  startCommand = "bash -c 'echo \"=== $ServiceName 启动 ===\"; /app/fix-plugin-config.sh; export OPENCLAW_CONFIG_PATH=/data/openclaw/openclaw.json; exec node dist/index.js gateway --allow-unconfigured --auth token --bind lan --port `${PORT:-8080}'"
  restartPolicyType = "always"
  restartPolicyMaxRetries = 10
"@

$railwayToml | Out-File -FilePath "$serviceDir\railway.toml" -Encoding UTF8
Write-Host "✅ 创建 railway.toml" -ForegroundColor Green

# 解析通道配置
$config = $ChannelConfig | ConvertFrom-Json

# 生成唯一 Token
$gatewayToken = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })

# 创建环境变量文件
$envContent = @"
# $ServiceName 环境变量配置
# 创建时间: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# === 基础配置 ===
NODE_ENV=production
RAILWAY_ENVIRONMENT=production
MODEL_NAME=$ModelName

# === 通道开关 (根据需要修改) ===
FEISHU_ENABLED=false
DINGTALK_ENABLED=false
WECOM_ENABLED=false
TELEGRAM_ENABLED=false
DISCORD_ENABLED=false
SLACK_ENABLED=false

# === 飞书配置 (如需启用请填写) ===
FEISHU_APP_ID=
FEISHU_APP_SECRET=

# === 钉钉配置 (如需启用请填写) ===
DINGTALK_CLIENT_ID=
DINGTALK_CLIENT_SECRET=

# === 企业微信配置 (如需启用请填写) ===
WECOM_CORP_ID=
WECOM_AGENT_ID=
WECOM_SECRET=

# === Gateway 认证 ===
GATEWAY_AUTH_MODE=token
OPENCLAW_GATEWAY_TOKEN=$gatewayToken

# === Gateway 配置 ===
GATEWAY_TRUSTED_PROXIES=100.64.0.0/10,127.0.0.1/32
GATEWAY_BIND=lan
DM_SCOPE=per-peer

# === WebSocket 配置 ===
GATEWAY_WEBSOCKET_TIMEOUT=3600000
GATEWAY_WEBSOCKET_MAX_CONNECTIONS=100
GATEWAY_WEBSOCKET_HEARTBEAT=30000

# === 资源限制 ===
GATEWAY_RATE_LIMIT=200/minute
GATEWAY_CONCURRENT_CONNECTIONS=100

# === 技能配置 ===
OPENCLAW_SKILLS_AUTO_INSTALL=false
OPENCLAW_BROWSER_ENABLED=true
OPENCLAW_BROWSER_EXECUTABLE=/usr/bin/chromium
OPENCLAW_BROWSER_HEADLESS=true
OPENCLAW_BROWSER_NO_SANDBOX=true

# === 日志配置 ===
LOG_LEVEL=info
"@

$envContent | Out-File -FilePath "$serviceDir\.env" -Encoding UTF8
Write-Host "✅ 创建 .env 配置文件" -ForegroundColor Green

Write-Host ""
Write-Host "=== 服务目录创建完成 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "📁 服务目录: $serviceDir"
Write-Host "🔑 Gateway Token: $gatewayToken"
Write-Host ""
Write-Host "📋 下一步操作:" -ForegroundColor Yellow
Write-Host "1. 编辑配置文件，填入通道信息:"
Write-Host "   code $serviceDir\.env"
Write-Host ""
Write-Host "2. 进入服务目录并添加到 Railway 项目:"
Write-Host "   cd $serviceDir"
Write-Host "   railway add --service $ServiceName"
Write-Host ""
Write-Host "3. 设置环境变量:"
Write-Host "   railway variables set FEISHU_APP_ID=xxx"
Write-Host "   railway variables set FEISHU_APP_SECRET=xxx"
Write-Host "   railway variables set FEISHU_ENABLED=true"
Write-Host ""
Write-Host "4. 部署服务:"
Write-Host "   railway up"
Write-Host ""
Write-Host "💡 提示: 新服务将共享项目的 openclaw-railway-volume"
