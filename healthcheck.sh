#!/bin/bash

# OpenClaw 健康检查脚本
echo "正在检查OpenClaw服务健康状态..."

# 检查WebSocket端口
if nc -z localhost 8080; then
    echo "✅ WebSocket端口8080正常"
else
    echo "❌ WebSocket端口8080不可用"
    exit 1
fi

# 检查Canvas服务
if curl -f http://localhost:8080/__openclaw__/canvas/ > /dev/null 2>&1; then
    echo "✅ Canvas服务正常"
else
    echo "⚠️ Canvas服务可能不可用，但WebSocket服务正常"
fi

# 检查心跳服务
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ 健康检查端点正常"
else
    echo "⚠️ 健康检查端点不可用，但WebSocket服务正常"
fi

echo "✅ 健康检查通过"
exit 0