# OpenClaw Railway 快速设置脚本
# 这个脚本帮助用户完成 Railway 的最后配置

Write-Host "🚀 OpenClaw Railway 快速设置" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# 生成随机密码
function Generate-Password {
    $length = 16
    $chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^*"
    $password = ""
    for ($i = 0; $i -lt $length; $i++) {
        $password += $chars[(Get-Random -Minimum 0 -Maximum $chars.Length)]
    }
    return $password
}

# 生成密码
$setupPassword = Generate-Password
Write-Host "🔑 生成的设置密码: $setupPassword" -ForegroundColor Yellow
Write-Host "⚠️  请保存这个密码，你将需要它来完成设置" -ForegroundColor Yellow
Write-Host ""

# 检查 Railway CLI
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI 未安装" -ForegroundColor Red
    Write-Host "请先安装: npm install -g @railway/cli" -ForegroundColor Yellow
    exit 1
}

# 设置环境变量
Write-Host "📋 设置环境变量..." -ForegroundColor Cyan

# 设置必需的环境变量
railway variables:set "SETUP_PASSWORD=$setupPassword"
railway variables:set "NODE_ENV=production"
railway variables:set "PORT=8080"

# 设置推荐的环境变量
railway variables:set "MODEL_NAME=anthropic/claude-opus-4.5"
railway variables:set "OAUTH_ENABLED=true"
railway variables:set "GATEWAY_AUTH_MODE=password"
railway variables:set "SANDBOX_MODE=non-main"
railway variables:set "DM_SCOPE=per-peer"
railway variables:set "OPENCLAW_STATE_DIR=/data/.openclaw"
railway variables:set "OPENCLAW_WORKSPACE_DIR=/data/workspace"

Write-Host "✅ 环境变量设置完成" -ForegroundColor Green
Write-Host ""

Write-Host "🎯 下一步手动配置：" -ForegroundColor Cyan
Write-Host "1. 打开 https://railway.app/" -ForegroundColor White
Write-Host "2. 选择项目 openclaw-railway" -ForegroundColor White
Write-Host "3. 进入 Service 设置" -ForegroundColor White
Write-Host "4. 启用 HTTP Proxy (端口 8080)" -ForegroundColor White
Write-Host "5. 添加 Volume (Name: openclaw-data, Mount Path: /data)" -ForegroundColor White
Write-Host ""

Write-Host "🎯 访问地址：" -ForegroundColor Green
Write-Host "设置向导: https://<your-domain>/setup" -ForegroundColor White
Write-Host "控制界面: https://<your-domain>/openclaw" -ForegroundColor White
Write-Host ""

Write-Host "📋 完成设置后的步骤：" -ForegroundColor Cyan
Write-Host "1. 访问 https://<your-domain>/setup" -ForegroundColor White
Write-Host "2. 输入密码: $setupPassword" -ForegroundColor White
Write-Host "3. 选择 AI 模型和认证方式" -ForegroundColor White
Write-Host "4. 完成设置向导" -ForegroundColor White
Write-Host "5. 访问 https://<your-domain>/openclaw 使用控制界面" -ForegroundColor White
Write-Host ""

Write-Host "🎉 设置完成！现在你可以开始使用 OpenClaw 了！" -ForegroundColor Green
Write-Host ""

# 显示帮助命令
Write-Host "🔧 有用的命令：" -ForegroundColor Cyan
Write-Host "查看日志: railway logs" -ForegroundColor White
Write-Host "查看状态: railway status" -ForegroundColor White
Write-Host "重新部署: railway up" -ForegroundColor White