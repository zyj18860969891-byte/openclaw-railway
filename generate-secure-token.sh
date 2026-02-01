#!/bin/bash

# 生成安全的Railway令牌
echo "正在生成安全令牌..."

# 生成32字节的随机令牌（64个十六进制字符）
SECURE_TOKEN=$(openssl rand -hex 32)

echo "=========================================="
echo "生成的安全令牌："
echo "$SECURE_TOKEN"
echo "=========================================="
echo ""
echo "请在Railway环境变量中设置："
echo "GATEWAY_TOKEN=$SECURE_TOKEN"
echo ""
echo "或者复制此令牌到railway.toml文件："
echo "GATEWAY_TOKEN = \"$SECURE_TOKEN\""
echo ""
echo "=========================================="
echo "令牌特性："
echo "- 长度：64个字符（32字节）"
echo "- 字符集：0-9, a-f（十六进制）"
echo "- 安全性：高（使用OpenSSL）"
echo "- 唯一性：极高（碰撞概率极低）"
echo "=========================================="

# 保存令牌到文件以便后续使用
echo "$SECURE_TOKEN" > /tmp/openclaw/gateway_token.txt
chmod 600 /tmp/openclaw/gateway_token.txt

echo "令牌已保存到 /tmp/openclaw/gateway_token.txt"