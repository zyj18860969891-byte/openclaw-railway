#!/bin/bash

echo "=== 测试 Railway 修复 ==="
echo "时间: $(date)"
echo ""

echo "=== 1. 检查 railway.toml 配置 ==="
if [ -f "railway.toml" ]; then
    echo "✅ railway.toml 存在"
    echo "启动命令:"
    grep "startCommand" railway.toml
    echo ""
else
    echo "❌ railway.toml 不存在"
    exit 1
fi

echo "=== 2. 检查 Dockerfile 配置 ==="
if [ -f "Dockerfile" ]; then
    echo "✅ Dockerfile 存在"
    echo "启动命令:"
    grep "exec node dist/index.js" Dockerfile
    echo ""
else
    echo "❌ Dockerfile 不存在"
    exit 1
fi

echo "=== 3. 检查 dist 目录 ==="
if [ -d "dist" ]; then
    echo "✅ dist 目录存在"
    echo "dist/index.js 存在: $([ -f "dist/index.js" ] && echo "✅" || echo "❌")"
    echo "dist/entry.js 存在: $([ -f "dist/entry.js" ] && echo "✅" || echo "❌")"
    echo "dist/cli 目录存在: $([ -d "dist/cli" ] && echo "✅" || echo "❌")"
    echo ""
else
    echo "❌ dist 目录不存在"
    exit 1
fi

echo "=== 4. 检查插件目录 ==="
echo "extensions/feishu 存在: $([ -d "extensions/feishu" ] && echo "✅" || echo "❌")"
echo "extensions/dingtalk 存在: $([ -d "extensions/dingtalk" ] && echo "✅" || echo "❌")"
echo "dist/channels/feishu 存在: $([ -d "dist/channels/feishu" ] && echo "✅" || echo "❌")"
echo "dist/channels/dingtalk 存在: $([ -d "dist/channels/dingtalk" ] && echo "✅" || echo "❌")"
echo ""

echo "=== 5. 检查脚本文件 ==="
echo "fix-plugin-config.sh 存在: $([ -f "fix-plugin-config.sh" ] && echo "✅" || echo "❌")"
echo "debug-plugins.sh 存在: $([ -f "debug-plugins.sh" ] && echo "✅" || echo "❌")"
echo "diagnose-plugins.sh 存在: $([ -f "diagnose-plugins.sh" ] && echo "✅" || echo "❌")"
echo ""

echo "=== 6. 检查环境变量配置 ==="
echo "检查 railway.toml 中的环境变量:"
grep -A 20 "\[env\]" railway.toml | head -15
echo ""

echo "=== 7. 检查构建缓存设置 ==="
echo "构建缓存版本:"
grep "CACHE_BUST" railway.toml
echo ""

echo "=== 8. 验证修复 ==="
echo "检查启动命令是否已修复:"
if grep -q "node dist/index.js gateway" railway.toml; then
    echo "✅ railway.toml 启动命令已修复"
else
    echo "❌ railway.toml 启动命令未修复"
fi

if grep -q "node dist/index.js gateway" Dockerfile; then
    echo "✅ Dockerfile 启动命令已修复"
else
    echo "❌ Dockerfile 启动命令未修复"
fi

echo ""
echo "=== 测试完成 ==="
echo "如果所有检查都通过， Railway 部署应该能够正常启动 OpenClaw 服务。"