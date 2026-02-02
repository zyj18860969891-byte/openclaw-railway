#!/bin/bash

# 确保OpenClaw配置文件存在并包含正确的端口设置

echo "正在检查OpenClaw配置文件..."

# 确保目录存在
mkdir -p /tmp/openclaw
mkdir -p /data/.openclaw

# 使用OpenClaw的端口
GATEWAY_PORT=8080
echo "使用端口: $GATEWAY_PORT"

# 使用正确的token环境变量
if [ -n "$OPENCLAW_GATEWAY_TOKEN" ]; then
    TOKEN="$OPENCLAW_GATEWAY_TOKEN"
    echo "使用token环境变量"
else
    TOKEN="aE8D17b2aef960C736De1cDFDdc4806d314e2C2DebDedAe84A832fdbDefAEC7A"
    echo "使用默认token"
fi

# 检查配置文件是否存在
CONFIG_PATH="/tmp/openclaw/openclaw.json"
if [ ! -f "$CONFIG_PATH" ]; then
    echo "创建新的配置文件：$CONFIG_PATH"
    cat > "$CONFIG_PATH" << EOF
{
  "gateway": {
    "mode": "local",
    "port": $GATEWAY_PORT,
    "bind": "lan",
    "auth": {
      "mode": "token",
      "token": "$TOKEN"
    },
    "trustedProxies": ["100.64.0.0/10"]
  },
  "controlUi": {
    "enabled": true
  },
  "canvasHost": {
    "enabled": true
  },
  "sandbox": {
    "mode": "non-main",
    "stateDir": "/tmp/openclaw",
    "workspaceDir": "/tmp/workspace"
  },
  "logging": {
    "level": "info",
    "format": "json"
  }
}
EOF
    chmod 600 "$CONFIG_PATH"
    echo "配置文件已创建，端口设置为: $GATEWAY_PORT"
else
    echo "配置文件已存在：$CONFIG_PATH"
    # 删除旧配置文件，重新创建以确保JSON结构正确
    echo "删除旧配置文件并重新创建..."
    rm -f "$CONFIG_PATH"
fi

# 无论配置文件是否存在，现在都重新创建
echo "创建新的配置文件：$CONFIG_PATH"
cat > "$CONFIG_PATH" << EOF
{
  "gateway": {
    "mode": "local",
    "port": $GATEWAY_PORT,
    "bind": "lan",
    "auth": {
      "mode": "token",
      "token": "$TOKEN"
    },
    "trustedProxies": ["100.64.0.0/10"]
  },
  "controlUi": {
    "enabled": true
  },
  "canvasHost": {
    "enabled": true
  },
  "sandbox": {
    "mode": "non-main",
    "stateDir": "/tmp/openclaw",
    "workspaceDir": "/tmp/workspace"
  },
  "logging": {
    "level": "info",
    "format": "json"
  }
}
EOF
chmod 600 "$CONFIG_PATH"
echo "配置文件已创建，端口设置为: $GATEWAY_PORT，token已设置"

# 显示配置文件内容以便调试
echo "配置文件内容："
cat "$CONFIG_PATH"
echo ""

# 确保配置文件权限正确
chmod 600 "$CONFIG_PATH"

echo "配置文件检查完成"