@echo off
REM OpenClaw 日志优化部署脚本
REM 解决 Railway 日志速率限制问题

echo 🚀 开始部署 OpenClaw 日志优化...

REM 1. 检查必要文件
if not exist "railway.toml" (
    echo ❌ railway.toml 文件不存在
    pause
    exit /b 1
)

REM 2. 优化日志配置
echo 🔧 优化日志配置...
node scripts/optimize-logging.mjs

REM 3. 检查配置
echo 📋 检查配置...
findstr "LOG_LEVEL=warn" railway.toml > nul
if %errorlevel% equ 0 (
    echo ✅ 日志级别已设置为 warn
) else (
    echo ❌ 日志级别配置未找到
    pause
    exit /b 1
)

REM 4. 构建项目
echo 🔨 构建项目...
call pnpm build

REM 5. 部署到 Railway
echo 🚀 部署到 Railway...
railway deploy

echo ✅ 部署完成！
echo.
echo 📋 部署后检查事项:
echo 1. 查看 Railway 日志，确认不再有速率限制警告
echo 2. 检查应用程序功能是否正常
echo 3. 监控系统性能
echo.
echo 🔧 如果仍有问题，可以尝试:
echo - 将 LOG_LEVEL 设置为 'error'
echo - 检查应用程序日志输出
echo - 使用 railway logs 命令查看实时日志

pause