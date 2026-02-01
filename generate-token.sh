#!/bin/bash

# 生成安全的Railway令牌
echo "正在生成安全令牌..."

# 生成32字节的随机令牌（64个十六进制字符）
SECURE_TOKEN=$(openssl rand -hex 32)

echo "生成的安全令牌：$SECURE_TOKEN"
echo ""
echo "请在Railway环境变量中设置："
echo "GATEWAY_TOKEN=$SECURE_TOKEN"
echo ""
echo "或者更新railway.toml文件："
echo "GATEWAY_TOKEN = \"$SECURE_TOKEN\""

# 保存令牌到文件以便后续使用
echo "$SECURE_TOKEN" > /tmp/openclaw/gateway_token.txt
chmod 600 /tmp/openclaw/gateway_token.txt

echo "令牌已保存到 /tmp/openclaw/gateway_token.txt"