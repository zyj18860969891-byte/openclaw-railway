#!/bin/bash

# 确保OpenClaw配置文件存在并包含正确的端口设置

echo "正在检查OpenClaw配置文件..."

# 确保目录存在
mkdir -p /tmp/openclaw
mkdir -p /data/.openclaw

# 使用Railway动态端口或OpenClaw默认端口
GATEWAY_PORT=${PORT:-18789}
echo "使用端口: $GATEWAY_PORT (来自环境变量 PORT: ${PORT:-"未设置"})"

# 使用正确的token环境变量
if [ -n "$OPENCLAW_GATEWAY_TOKEN" ]; then
    TOKEN="$OPENCLAW_GATEWAY_TOKEN"
    echo "使用token环境变量: ${TOKEN:0:20}..."
else
    TOKEN="aE8D17b2aef960C736De1cDFDdc4806d314e2C2DebDedAe84A832fdbDefAEC7A"
    echo "使用默认token: ${TOKEN:0:20}..."
fi

# 从环境变量读取 trustedProxies，保持与 railway.toml 一致
if [ -n "$GATEWAY_TRUSTED_PROXIES" ]; then
    # 将逗号分隔的字符串转换为 JSON 数组
    IFS=',' read -ra PROXIES <<< "$GATEWAY_TRUSTED_PROXIES"
    TRUSTED_PROXIES_JSON="["
    for PROXY in "${PROXIES[@]}"; do
        PROXY=$(echo "$PROXY" | xargs)
        [ -n "$PROXY" ] && TRUSTED_PROXIES_JSON="${TRUSTED_PROXIES_JSON}\"${PROXY}\","
    done
    TRUSTED_PROXIES_JSON="${TRUSTED_PROXIES_JSON%,}]"
    echo "使用 GATEWAY_TRUSTED_PROXIES: $GATEWAY_TRUSTED_PROXIES"
else
    TRUSTED_PROXIES_JSON="[\"100.64.0.0/10\"]"
    echo "使用默认 trustedProxies"
fi

# 配置文件路径
CONFIG_PATH="/tmp/openclaw/openclaw.json"

# 总是重新创建配置文件以确保JSON结构正确
echo "删除旧配置文件（如果存在）..."
rm -f "$CONFIG_PATH"

echo "创建新的配置文件：$CONFIG_PATH"

# 从环境变量读取模型名称，如果没有设置则使用默认值
MODEL_NAME=${MODEL_NAME:-"xiaomi/mimo-v2-flash"}
echo "使用模型: $MODEL_NAME"

# 使用正确的JSON结构创建配置文件
cat <<EOF > "$CONFIG_PATH"
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "$MODEL_NAME"
      },
      "workspace": "/tmp/openclaw",
      "sandbox": {
        "mode": "non-main"
      }
    }
  },
  "gateway": {
    "mode": "local",
    "port": $GATEWAY_PORT,
    "bind": "lan",
    "auth": {
      "mode": "token",
      "token": "$TOKEN"
    },
    "trustedProxies": $TRUSTED_PROXIES_JSON,
    "controlUi": {
      "enabled": true,
      "allowInsecureAuth": true,
      "dangerouslyDisableDeviceAuth": true
    }
  },
  "canvasHost": {
    "enabled": true
  },
  "logging": {
    "level": "info",
    "consoleStyle": "json"
  }
}
EOF

chmod 600 "$CONFIG_PATH"
echo "配置文件已创建，端口设置为: $GATEWAY_PORT，token已设置"

# 验证JSON格式
if command -v python3 &> /dev/null; then
    echo "验证JSON格式..."
    python3 -m json.tool "$CONFIG_PATH" > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ JSON格式正确"
    else
        echo "❌ JSON格式错误！"
    fi
fi

# 显示配置文件内容以便调试
echo "配置文件内容："
cat "$CONFIG_PATH"
echo ""
echo "配置文件中的token值："
grep -o '"token": "[^"]*"' "$CONFIG_PATH" || echo "未找到token字段"

# 关键：设置环境变量确保 OpenClaw 使用正确的配置文件
export OPENCLAW_STATE_DIR="/tmp/openclaw"
export OPENCLAW_CONFIG_PATH="/tmp/openclaw/openclaw.json"
echo "设置环境变量: OPENCLAW_STATE_DIR=$OPENCLAW_STATE_DIR, OPENCLAW_CONFIG_PATH=$OPENCLAW_CONFIG_PATH"

echo "配置文件检查完成"