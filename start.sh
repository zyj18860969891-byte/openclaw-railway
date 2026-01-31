#!/bin/bash

# OpenClaw Railway 启动脚本
# 动态注入环境变量并启动服务

# 创建配置目录
mkdir -p ~/.openclaw
mkdir -p ~/.openclaw/credentials

# 使用环境变量生成或更新配置文件
cat <<EOF > ~/.openclaw/moltbot.json
{
  "agent": {
    "model": "\${MODEL_NAME:-anthropic/claude-opus-4-5}",
    "defaults": {
      "workspace": "~/.openclaw",
      "sandbox": {
        "mode": "non-main"
      }
    }
  },
  "session": {
    "dmScope": "per-peer"
  },
  "channels": {
    "feishu": {
      "enabled": \${FEISHU_ENABLED:-false},
      "appId": "\${FEISHU_APP_ID}",
      "appSecret": "\${FEISHU_APP_SECRET}",
      "connectionMode": "websocket"
    },
    "dingtalk": {
      "enabled": \${DINGTALK_ENABLED:-false},
      "clientId": "\${DINGTALK_CLIENT_ID}",
      "clientSecret": "\${DINGTALK_CLIENT_SECRET}",
      "dmPolicy": "pairing"
    }
  },
  "gateway": {
    "tailscale": {
      "mode": "\${GATEWAY_TAILSCALE_MODE:-funnel}"
    },
    "auth": {
      "mode": "\${GATEWAY_AUTH_MODE:-password}"
    }
  },
  "oauth": {
    "enabled": \${OAUTH_ENABLED:-true},
    "providers": {
      "google": {
        "clientId": "\${GOOGLE_CLIENT_ID}",
        "clientSecret": "\${GOOGLE_CLIENT_SECRET}",
        "redirectUri": "\${REDIRECT_URI}/auth/google/callback",
        "scope": ["openid", "profile", "email"]
      }
    }
  },
  "skills": {
    "enabled": true,
    "sources": [
      {
        "type": "cli",
        "command": "npx skills add",
        "registry": "https://skills.sh"
      }
    ]
  }
}
EOF

# 设置权限
chmod 600 ~/.openclaw/moltbot.json
chmod 700 ~/.openclaw/credentials

# 启动 OpenClaw 网关，绑定 Railway 动态端口
echo "🚀 Starting OpenClaw Gateway on port \$PORT..."
echo "📋 Configuration loaded from environment variables"
echo "🔐 OAuth enabled: \$OAUTH_ENABLED"
echo "🌐 Gateway mode: \$GATEWAY_AUTH_MODE"

# 启动服务
node dist/index.js gateway --port \${PORT:-3000} --allow-unconfigured --bind lan --verbose