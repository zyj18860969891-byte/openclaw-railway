@echo off
REM OpenClaw Railway 启动脚本 (Windows版本)
REM 动态注入环境变量并启动服务

echo 🚀 Starting OpenClaw Gateway setup...

REM 创建配置目录
if not exist "%USERPROFILE%\.openclaw" mkdir "%USERPROFILE%\.openclaw"
if not exist "%USERPROFILE%\.openclaw\credentials" mkdir "%USERPROFILE%\.openclaw\credentials"

REM 使用环境变量生成配置文件
(
echo {
echo   "agent": {
echo     "model": "%MODEL_NAME%:anthropic/claude-opus-4-5",
echo     "defaults": {
echo       "workspace": "%USERPROFILE%\.openclaw",
echo       "sandbox": {
echo         "mode": "non-main"
echo       }
echo     }
echo   },
echo   "session": {
echo     "dmScope": "per-peer"
echo   },
echo   "channels": {
echo     "feishu": {
echo       "enabled": %FEISHU_ENABLED%,
echo       "appId": "%FEISHU_APP_ID%",
echo       "appSecret": "%FEISHU_APP_SECRET%",
echo       "connectionMode": "websocket"
echo     },
echo     "dingtalk": {
echo       "enabled": %DINGTALK_ENABLED%,
echo       "clientId": "%DINGTALK_CLIENT_ID%",
echo       "clientSecret": "%DINGTALK_CLIENT_SECRET%",
echo       "dmPolicy": "pairing"
echo     }
echo   },
echo   "gateway": {
echo     "tailscale": {
echo       "mode": "%GATEWAY_TAILSCALE_MODE%"
echo     },
echo     "auth": {
echo       "mode": "%GATEWAY_AUTH_MODE%"
echo     }
echo   },
echo   "oauth": {
echo     "enabled": %OAUTH_ENABLED%,
echo     "providers": {
echo       "google": {
echo         "clientId": "%GOOGLE_CLIENT_ID%",
echo         "clientSecret": "%GOOGLE_CLIENT_SECRET%",
echo         "redirectUri": "%REDIRECT_URI%/auth/google/callback",
echo         "scope": ["openid", "profile", "email"]
echo       }
echo     }
echo   },
echo   "railway": {
echo     "enabled": true,
echo     "port": "%PORT%",
echo     "environment": "%NODE_ENV%"
echo   },
echo   "agent": {
echo     "model": "%MODEL_NAME%"
echo   }
echo }

) > "%USERPROFILE%\.openclaw\moltbot.json"

REM 设置文件权限
icacls "%USERPROFILE%\.openclaw\moltbot.json" /inheritance:r
icacls "%USERPROFILE%\.openclaw\moltbot.json" /grant "%USERNAME%:F"

REM 启动 OpenClaw 网关
echo 🚀 Starting OpenClaw Gateway on port %PORT%...
echo 📋 Configuration loaded from environment variables
echo 🔐 OAuth enabled: %OAUTH_ENABLED%
echo 🌐 Gateway mode: %GATEWAY_AUTH_MODE%

REM 启动服务
node dist\index.js gateway --port %PORT% --allow-unconfigured --bind lan --verbose