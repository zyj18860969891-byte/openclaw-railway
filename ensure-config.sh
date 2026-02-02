#!/bin/bash

# 确保OpenClaw配置文件存在并包含正确的端口设置

echo "正在检查OpenClaw配置文件..."

# 确保目录存在
mkdir -p /tmp/openclaw
mkdir -p /data/.openclaw

# 使用OpenClaw的默认端口
GATEWAY_PORT=18789
echo "使用OpenClaw默认端口: $GATEWAY_PORT"

# 检查配置文件是否存在
CONFIG_PATH="/tmp/openclaw/openclaw.json"
if [ ! -f "$CONFIG_PATH" ]; then
    echo "创建新的配置文件：$CONFIG_PATH"
    cat > "$CONFIG_PATH" << EOF
{
  "gateway": {
    "mode": "local",
    "port": $GATEWAY_PORT,
    "bind": "lan"
  },
  "logging": {
    "level": "info"
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
    # 检查配置文件是否包含端口设置
    if ! grep -q '"port"' "$CONFIG_PATH"; then
        echo "添加端口设置到配置文件"
        # 使用jq来修改JSON文件（如果可用）
        if command -v jq &> /dev/null; then
            jq ".gateway.port = $GATEWAY_PORT" "$CONFIG_PATH" > "$CONFIG_PATH.tmp" && mv "$CONFIG_PATH.tmp" "$CONFIG_PATH"
            echo "使用jq修改了端口为: $GATEWAY_PORT"
        else
            # 如果没有jq，使用sed
            sed -i "s/\"port\": [0-9]*/\"port\": $GATEWAY_PORT/" "$CONFIG_PATH" || \
            sed -i "s/\"port\": .*/\"port\": $GATEWAY_PORT/" "$CONFIG_PATH"
            echo "使用sed修改了端口为: $GATEWAY_PORT"
        fi
    else
        echo "端口设置已存在"
    fi
    # 显示修改后的配置文件内容
    echo "修改后的配置文件内容："
    cat "$CONFIG_PATH"
    echo ""
fi

# 确保配置文件权限正确
chmod 600 "$CONFIG_PATH"

echo "配置文件检查完成"