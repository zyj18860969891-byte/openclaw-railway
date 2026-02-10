# OpenClaw 多实例部署脚本 - PowerShell 版本
# 用法: .\create-instance.ps1 -Username <用户名> -ChannelType <通道类型> [-ChannelConfig <JSON配置>]

param(
    [Parameter(Mandatory=$true)]
    [string]$Username,
    
    [Parameter(Mandatory=$true)]
    [ValidateSet("feishu", "dingtalk", "wecom")]
    [string]$ChannelType,
    
    [string]$ChannelConfig = "{}",
    
    [string]$ModelName = "openrouter/stepfun/step-3.5-flash:free"
)

$ErrorActionPreference = "Stop"

# 实例名称
$InstanceName = "openclaw-$Username-$ChannelType"
$InstanceDir = "instances\$InstanceName"
$TemplatesDir = "templates"
$CreateTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$CacheBust = Get-Date -Format "yyyyMMddHHmmss"

Write-Host "=== 创建新实例: $InstanceName ===" -ForegroundColor Cyan
Write-Host "用户: $Username"
Write-Host "通道: $ChannelType"
Write-Host "时间: $CreateTime"
Write-Host ""

# 检查实例是否已存在
if (Test-Path $InstanceDir) {
    Write-Host "❌ 实例已存在: $InstanceName" -ForegroundColor Red
    Write-Host "如需重新创建，请先删除: Remove-Item -Recurse -Force $InstanceDir"
    exit 1
}

# 创建实例目录
New-Item -ItemType Directory -Path $InstanceDir -Force | Out-Null
Write-Host "✅ 创建实例目录: $InstanceDir" -ForegroundColor Green

# 读取模板文件
$railwayTemplate = Get-Content "$TemplatesDir\railway.template.toml" -Raw
$envTemplate = Get-Content "$TemplatesDir\env.template" -Raw

# 解析通道配置
$config = $ChannelConfig | ConvertFrom-Json

# 设置通道开关
$feishuEnabled = "false"
$dingtalkEnabled = "false"
$wecomEnabled = "false"

$feishuAppId = ""
$feishuAppSecret = ""
$dingtalkClientId = ""
$dingtalkClientSecret = ""
$wecomCorpId = ""
$wecomAgentId = ""
$wecomSecret = ""

switch ($ChannelType) {
    "feishu" {
        $feishuEnabled = "true"
        $feishuAppId = if ($config.appId) { $config.appId } else { "{{FEISHU_APP_ID}}" }
        $feishuAppSecret = if ($config.appSecret) { $config.appSecret } else { "{{FEISHU_APP_SECRET}}" }
    }
    "dingtalk" {
        $dingtalkEnabled = "true"
        $dingtalkClientId = if ($config.clientId) { $config.clientId } else { "{{DINGTALK_CLIENT_ID}}" }
        $dingtalkClientSecret = if ($config.clientSecret) { $config.clientSecret } else { "{{DINGTALK_CLIENT_SECRET}}" }
    }
    "wecom" {
        $wecomEnabled = "true"
        $wecomCorpId = if ($config.corpId) { $config.corpId } else { "{{WECOM_CORP_ID}}" }
        $wecomAgentId = if ($config.agentId) { $config.agentId } else { "{{WECOM_AGENT_ID}}" }
        $wecomSecret = if ($config.secret) { $config.secret } else { "{{WECOM_SECRET}}" }
    }
}

# 生成唯一 Token
$gatewayToken = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })

# 替换模板变量
$railwayContent = $railwayTemplate `
    -replace '\{\{INSTANCE_NAME\}\}', $InstanceName `
    -replace '\{\{CREATE_TIME\}\}', $CreateTime `
    -replace '\{\{CACHE_BUST\}\}', $CacheBust `
    -replace '\{\{FEISHU_ENABLED\}\}', $feishuEnabled `
    -replace '\{\{DINGTALK_ENABLED\}\}', $dingtalkEnabled `
    -replace '\{\{WECOM_ENABLED\}\}', $wecomEnabled `
    -replace '\{\{MODEL_NAME\}\}', $ModelName `
    -replace '\{\{GATEWAY_TOKEN\}\}', $gatewayToken

$envContent = $envTemplate `
    -replace '\{\{INSTANCE_NAME\}\}', $InstanceName `
    -replace '\{\{USERNAME\}\}', $Username `
    -replace '\{\{CHANNEL_TYPE\}\}', $ChannelType `
    -replace '\{\{CREATE_TIME\}\}', $CreateTime `
    -replace '\{\{FEISHU_ENABLED\}\}', $feishuEnabled `
    -replace '\{\{DINGTALK_ENABLED\}\}', $dingtalkEnabled `
    -replace '\{\{WECOM_ENABLED\}\}', $wecomEnabled `
    -replace '\{\{FEISHU_APP_ID\}\}', $feishuAppId `
    -replace '\{\{FEISHU_APP_SECRET\}\}', $feishuAppSecret `
    -replace '\{\{DINGTALK_CLIENT_ID\}\}', $dingtalkClientId `
    -replace '\{\{DINGTALK_CLIENT_SECRET\}\}', $dingtalkClientSecret `
    -replace '\{\{WECOM_CORP_ID\}\}', $wecomCorpId `
    -replace '\{\{WECOM_AGENT_ID\}\}', $wecomAgentId `
    -replace '\{\{WECOM_SECRET\}\}', $wecomSecret `
    -replace '\{\{GATEWAY_TOKEN\}\}', $gatewayToken `
    -replace '\{\{MODEL_NAME\}\}', $ModelName

# 写入配置文件
$railwayContent | Out-File -FilePath "$InstanceDir\railway.toml" -Encoding UTF8
$envContent | Out-File -FilePath "$InstanceDir\.env" -Encoding UTF8

Write-Host "✅ 配置文件已生成" -ForegroundColor Green
Write-Host "   - $InstanceDir\railway.toml"
Write-Host "   - $InstanceDir\.env"
Write-Host ""

# 复制必要的文件
$sourceDir = "."

# 复制 Dockerfile
if (Test-Path "$sourceDir\Dockerfile.railway") {
    Copy-Item "$sourceDir\Dockerfile.railway" "$InstanceDir\Dockerfile.railway"
    Write-Host "✅ 复制 Dockerfile.railway" -ForegroundColor Green
}

# 复制配置脚本
if (Test-Path "$sourceDir\fix-plugin-config.sh") {
    Copy-Item "$sourceDir\fix-plugin-config.sh" "$InstanceDir\fix-plugin-config.sh"
    Write-Host "✅ 复制 fix-plugin-config.sh" -ForegroundColor Green
}

# 复制 package.json (用于 Railway 检测)
if (Test-Path "$sourceDir\package.json") {
    Copy-Item "$sourceDir\package.json" "$InstanceDir\package.json"
    Write-Host "✅ 复制 package.json" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== 实例创建完成 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 下一步操作:" -ForegroundColor Yellow
Write-Host "1. 检查配置文件: code $InstanceDir\.env"
Write-Host "2. 部署实例: .\scripts-deploy\deploy-instance.ps1 -InstanceName $InstanceName"
Write-Host ""
Write-Host "📝 重要信息:" -ForegroundColor Yellow
Write-Host "   Gateway Token: $gatewayToken"
Write-Host "   请保存此 Token，用于 Control UI 登录"
