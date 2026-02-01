@echo off
echo 🚀 OpenClaw Railway 快速设置
echo ================================
echo.

REM 生成随机密码
set "password=%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%%RANDOM%"
set "password=%password:~0,16%"
echo 🔑 生成的设置密码: %password%
echo ⚠️  请保存这个密码，你将需要它来完成设置
echo.

REM 检查 Railway CLI
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Railway CLI 未安装
    echo 请先安装: npm install -g @railway/cli
    pause
    exit /b 1
)

REM 设置环境变量
echo 📋 设置环境变量...
railway variables:set "SETUP_PASSWORD=%password%"
railway variables:set "NODE_ENV=production"
railway variables:set "PORT=8080"
railway variables:set "MODEL_NAME=anthropic/claude-opus-4.5"
railway variables:set "OAUTH_ENABLED=true"
railway variables:set "GATEWAY_AUTH_MODE=password"
railway variables:set "SANDBOX_MODE=non-main"
railway variables:set "DM_SCOPE=per-peer"
railway variables:set "OPENCLAW_STATE_DIR=/data/.openclaw"
railway variables:set "OPENCLAW_WORKSPACE_DIR=/data/workspace"
echo ✅ 环境变量设置完成
echo.

echo 🎯 下一步手动配置：
echo 1. 打开 https://railway.app/
echo 2. 选择项目 openclaw-railway
echo 3. 进入 Service 设置
echo 4. 启用 HTTP Proxy (端口 8080)
echo 5. 添加 Volume (Name: openclaw-data, Mount Path: /data)
echo.

echo 🎯 访问地址：
echo 设置向导: https://^<your-domain^>/setup
echo 控制界面: https://^<your-domain^>/openclaw
echo.

echo 📋 完成设置后的步骤：
echo 1. 访问 https://^<your-domain^>/setup
echo 2. 输入密码: %password%
echo 3. 选择 AI 模型和认证方式
echo 4. 完成设置向导
echo 5. 访问 https://^<your-domain^>/openclaw 使用控制界面
echo.

echo 🎉 设置完成！现在你可以开始使用 OpenClaw 了！
echo.

echo 🔧 有用的命令：
echo 查看日志: railway logs
echo 查看状态: railway status
echo 重新部署: railway up

pause