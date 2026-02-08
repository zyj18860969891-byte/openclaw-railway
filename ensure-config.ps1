#!/usr/bin/env pwsh

# OpenClaw配置文件生成脚本 (PowerShell版本)
# 用于生成OpenClaw的配置文件JSON

# 配置文件路径
$ConfigFile = "/tmp/openclaw/openclaw.json"

# 确保配置目录存在
New-Item -ItemType Directory -Force -Path "/tmp/openclaw" | Out-Null

# 删除旧配置文件（如果存在）
if (Test-Path $ConfigFile) {
    Write-Host "删除旧配置文件（如果存在）..."
    Remove-Item $ConfigFile -Force
}

# 获取环境变量
$Port = $env:PORT
if (-not $Port) { $Port = 8080 }
Write-Host "使用端口: $Port (来自环境变量 PORT: $($env:PORT))"

$Token = $env:OPENCLAW_TOKEN
if (-not $Token) { 
    $Token = "aE8D17b2aef960C736De1cDFDdc4806d314e2C2DebDedAe84A832fdbDefAEC7A"
}
Write-Host "使用token环境变量: $($Token.Substring(0, [Math]::Min(20, $Token.Length)))..."

$TrustedProxies = $env:GATEWAY_TRUSTED_PROXIES
if (-not $TrustedProxies) {
    $TrustedProxies = "100.64.0.0/10,23.227.167.3/32"
}
Write-Host "使用 GATEWAY_TRUSTED_PROXIES: $TrustedProxies"

$ModelName = $env:MODEL_NAME
if (-not $ModelName) {
    $ModelName = "openrouter/stepfun/step-3.5-flash:free"
}
Write-Host "使用模型: $ModelName"

Write-Host "✅ 飞书通道已启用 (FEISHU_ENABLED=true)"
Write-Host "✅ 钉钉通道已启用 (DINGTALK_ENABLED=true)"
Write-Host "配置文件已创建，端口设置为: $Port，token已设置"

# 构建JSON配置
$Config = @{
    agents = @{
        defaults = @{
            model = @{
                primary = $ModelName
            }
            workspace = "/tmp/openclaw"
            sandbox = @{
                mode = "non-main"
            }
        }
    }
    gateway = @{
        mode = "local"
        port = [int]$Port
        bind = "lan"
        auth = @{
            mode = "token"
            token = $Token
        }
        trustedProxies = $TrustedProxies -split ',' | ForEach-Object { $_.Trim() }
        controlUi = @{
            enabled = $true
            allowInsecureAuth = $true
            dangerouslyDisableDeviceAuth = $true
        }
    }
    canvasHost = @{
        enabled = $true
    }
    logging = @{
        level = "info"
        consoleStyle = "json"
    }
    channels = @{
        feishu = @{
            enabled = $true
            appId = "cli_a90b00a3bd799cb1"
            appSecret = "LPjfXz3MxIlkLzsZOwXJIfVht0il4gEj"
            dmPolicy = "open"
            groupPolicy = "open"
        }
        dingtalk = @{
            enabled = $true
            clientId = "dingwmptjicih9yk2dmr"
            clientSecret = "w8p_LcdLbsjMNeaGHn3kyd8s6Q91SXmItawbm_JgBKsOSdsoo3MYuG_JMuzfkxh5"
            dmPolicy = "open"
            groupPolicy = "open"
        }
    }
}

# 转换为JSON并保存
$ConfigJson = $Config | ConvertTo-Json -Depth 10
Set-Content -Path $ConfigFile -Value $ConfigJson -Encoding UTF8

Write-Host "验证JSON格式..."
try {
    $null = Get-Content $ConfigFile -Raw | ConvertFrom-Json
    Write-Host "✅ JSON格式正确"
} catch {
    Write-Host "❌ JSON格式错误: $($_.Exception.Message)"
    exit 1
}

Write-Host "配置文件内容："
Get-Content $ConfigFile

Write-Host "配置文件中的token值："
$ConfigJson -match '"token":\s*"[^"]*"' | Out-Null
if ($Matches) { Write-Host $Matches[0] }

# 设置环境变量
$env:OPENCLAW_STATE_DIR = "/tmp/openclaw"
$env:OPENCLAW_CONFIG_PATH = "/tmp/openclaw/openclaw.json"

Write-Host "设置环境变量: OPENCLAW_STATE_DIR=/tmp/openclaw, OPENCLAW_CONFIG_PATH=/tmp/openclaw/openclaw.json"
Write-Host "配置文件检查完成"