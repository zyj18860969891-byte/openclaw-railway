# OpenClaw 同项目新服务创建脚本
# 在同一个 Railway 项目中创建新服务（独立 Volume）
# 用法: .\create-service.ps1 -ServiceName <服务名> -ChannelType <通道类型> [-ChannelConfig <JSON配置>]

param(
    [Parameter(Mandatory=$true)]
    [string]$ServiceName,
    
    [Parameter(Mandatory=$true)]
    [ValidateSet("feishu", "dingtalk", "wecom")]
    [string]$ChannelType,
    
    [string]$ChannelConfig = "{}",
    
    [string]$ModelName = "openrouter/stepfun/step-3.5-flash:free",
    
    [int]$VolumeSizeGB = 1
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OpenClaw 新服务创建（同项目独立 Volume）" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Railway CLI
Write-Host "[1/6] 检查 Railway CLI..." -ForegroundColor Yellow
try {
    $version = railway --version 2>&1
    Write-Host "  ✅ Railway CLI: $version" -ForegroundColor Green
} catch {
    Write-Host "  ❌ 请先安装 Railway CLI: npm install -g @railway/cli" -ForegroundColor Red
    exit 1
}

# 检查登录状态
Write-Host ""
Write-Host "[2/6] 检查 Railway 登录..." -ForegroundColor Yellow
try {
    $whoami = railway whoami 2>&1
    Write-Host "  ✅ 已登录: $whoami" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️ 未登录，请登录..." -ForegroundColor Yellow
    railway login
}

# 检查当前项目
Write-Host ""
Write-Host "[3/6] 检查当前项目..." -ForegroundColor Yellow
try {
    $status = railway status 2>&1
    Write-Host "  ✅ $status" -ForegroundColor Green
} catch {
    Write-Host "  ❌ 请先链接到项目: railway link" -ForegroundColor Red
    exit 1
}

# 解析通道配置
Write-Host ""
Write-Host "[4/6] 解析通道配置..." -ForegroundColor Yellow
$config = $ChannelConfig | ConvertFrom-Json

$envVars = @{}

switch ($ChannelType) {
    "feishu" {
        $envVars["FEISHU_ENABLED"] = "true"
        $envVars["DINGTALK_ENABLED"] = "false"
        $envVars["WECOM_ENABLED"] = "false"
        if ($config.appId) { $envVars["FEISHU_APP_ID"] = $config.appId }
        if ($config.appSecret) { $envVars["FEISHU_APP_SECRET"] = $config.appSecret }
        Write-Host "  ✅ 飞书配置: appId=$($config.appId)" -ForegroundColor Green
    }
    "dingtalk" {
        $envVars["FEISHU_ENABLED"] = "false"
        $envVars["DINGTALK_ENABLED"] = "true"
        $envVars["WECOM_ENABLED"] = "false"
        if ($config.clientId) { $envVars["DINGTALK_CLIENT_ID"] = $config.clientId }
        if ($config.clientSecret) { $envVars["DINGTALK_CLIENT_SECRET"] = $config.clientSecret }
        Write-Host "  ✅ 钉钉配置: clientId=$($config.clientId)" -ForegroundColor Green
    }
    "wecom" {
        $envVars["FEISHU_ENABLED"] = "false"
        $envVars["DINGTALK_ENABLED"] = "false"
        $envVars["WECOM_ENABLED"] = "true"
        if ($config.corpId) { $envVars["WECOM_CORP_ID"] = $config.corpId }
        if ($config.agentId) { $envVars["WECOM_AGENT_ID"] = $config.agentId }
        if ($config.secret) { $envVars["WECOM_SECRET"] = $config.secret }
        Write-Host "  ✅ 企业微信配置: corpId=$($config.corpId)" -ForegroundColor Green
    }
}

# 添加通用配置
$gatewayToken = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
$envVars["NODE_ENV"] = "production"
$envVars["MODEL_NAME"] = $ModelName
$envVars["GATEWAY_AUTH_MODE"] = "token"
$envVars["OPENCLAW_GATEWAY_TOKEN"] = $gatewayToken
$envVars["OPENCLAW_BROWSER_ENABLED"] = "true"
$envVars["OPENCLAW_BROWSER_EXECUTABLE"] = "/usr/bin/chromium"
$envVars["OPENCLAW_BROWSER_HEADLESS"] = "true"
$envVars["OPENCLAW_BROWSER_NO_SANDBOX"] = "true"
$envVars["OPENCLAW_SKILLS_AUTO_INSTALL"] = "false"
$envVars["DM_SCOPE"] = "per-peer"

Write-Host "  ✅ Gateway Token: $gatewayToken" -ForegroundColor Green

# 创建服务
Write-Host ""
Write-Host "[5/6] 创建新服务: $ServiceName" -ForegroundColor Yellow
Write-Host "  ⚠️ 请在 Railway Dashboard 中手动创建服务:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. 打开: https://railway.app/project/openclaw-railway" -ForegroundColor White
Write-Host "  2. 点击 '+ New Service'" -ForegroundColor White
Write-Host "  3. 选择 'GitHub Repo'" -ForegroundColor White
Write-Host "  4. 选择仓库: openclaw-railway" -ForegroundColor White
Write-Host "  5. 设置服务名称: $ServiceName" -ForegroundColor White
Write-Host "  6. 设置 Root Directory: openclaw-main" -ForegroundColor White
Write-Host ""
Write-Host "  创建完成后按 Enter 继续..." -ForegroundColor Yellow
Read-Host

# 设置环境变量
Write-Host ""
Write-Host "[6/6] 设置环境变量..." -ForegroundColor Yellow

Write-Host ""
Write-Host "  请在 Railway Dashboard 中设置以下环境变量:" -ForegroundColor Yellow
Write-Host "  服务: $ServiceName → Variables" -ForegroundColor White
Write-Host ""

foreach ($kv in $envVars.GetEnumerator()) {
    $value = $kv.Value
    if ($value.Length -gt 30) {
        $displayValue = $value.Substring(0, 30) + "..."
    } else {
        $displayValue = $value
    }
    Write-Host "  $($kv.Key) = $displayValue" -ForegroundColor Gray
}

Write-Host ""
Write-Host "  设置完成后按 Enter 继续..." -ForegroundColor Yellow
Read-Host

# 创建 Volume
Write-Host ""
Write-Host "[7/6] 创建 Volume..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  请在 Railway Dashboard 中创建 Volume:" -ForegroundColor Yellow
Write-Host "  1. 选择服务: $ServiceName" -ForegroundColor White
Write-Host "  2. Settings → Volumes → Add Volume" -ForegroundColor White
Write-Host "  3. 设置挂载路径: /data" -ForegroundColor White
Write-Host "  4. 设置大小: ${VolumeSizeGB}GB" -ForegroundColor White
Write-Host ""
Write-Host "  创建完成后按 Enter 继续..." -ForegroundColor Yellow
Read-Host

# 部署
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  服务配置完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 服务信息:" -ForegroundColor Yellow
Write-Host "  服务名称: $ServiceName" -ForegroundColor White
Write-Host "  通道类型: $ChannelType" -ForegroundColor White
Write-Host "  AI 模型: $ModelName" -ForegroundColor White
Write-Host "  Volume: ${VolumeSizeGB}GB (挂载到 /data)" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Gateway Token (请保存):" -ForegroundColor Yellow
Write-Host "  $gatewayToken" -ForegroundColor White
Write-Host ""
Write-Host "📋 下一步:" -ForegroundColor Yellow
Write-Host "  1. 在 Railway Dashboard 点击 'Deploy'" -ForegroundColor White
Write-Host "  2. 等待部署完成" -ForegroundColor White
Write-Host "  3. 在通道平台配置 Webhook（如需要）" -ForegroundColor White
Write-Host "  4. 测试发送消息" -ForegroundColor White
Write-Host ""

# 保存配置到本地
$configDir = "instances\$ServiceName"
New-Item -ItemType Directory -Path $configDir -Force | Out-Null

$envContent = "# $ServiceName 配置`n"
$envContent += "# 创建时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"
$envContent += "# Gateway Token: $gatewayToken`n`n"

foreach ($kv in $envVars.GetEnumerator()) {
    $envContent += "$($kv.Key)=$($kv.Value)`n"
}

$envContent | Out-File -FilePath "$configDir\.env" -Encoding UTF8
Write-Host "✅ 配置已保存到: $configDir\.env" -ForegroundColor Green
