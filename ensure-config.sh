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
    # 显示当前配置文件内容
    echo "当前配置文件内容："
    cat "$CONFIG_PATH"
    echo ""
    # 更新token和端口设置
    echo "更新配置文件中的token和端口设置..."
    # 使用jq来修改JSON文件（如果可用）
    if command -v jq &> /dev/null; then
        jq ".gateway.port = $GATEWAY_PORT | .gateway.auth.token = \"$TOKEN\"" "$CONFIG_PATH" > "$CONFIG_PATH.tmp" && mv "$CONFIG_PATH.tmp" "$CONFIG_PATH"
        echo "使用jq更新了端口为: $GATEWAY_PORT 和token"
    else
        # 如果没有jq，使用sed更新端口
        if ! grep -q '"port"' "$CONFIG_PATH"; then
            sed -i "s/\"port\": [0-9]*/\"port\": $GATEWAY_PORT/" "$CONFIG_PATH" || \
            sed -i "s/\"port\": .*/\"port\": $GATEWAY_PORT/" "$CONFIG_PATH"
            echo "使用sed添加/修改了端口为: $GATEWAY_PORT"
        fi
        # 使用sed更新token (匹配 "token": "..." 格式)
        sed -i "s/\"token\": \"[^\"]*\"/\"token\": \"$TOKEN\"/" "$CONFIG_PATH"
        echo "使用sed更新了token"
    fi
    # 显示修改后的配置文件内容
    echo "修改后的配置文件内容："
    cat "$CONFIG_PATH"
    echo ""
fi

# 确保配置文件权限正确
chmod 600 "$CONFIG_PATH"

echo "配置文件检查完成"