#!/bin/bash

echo "=== 调试插件状态 ==="
echo "时间: $(date)"
echo "工作目录: $(pwd)"
echo "用户: $(whoami)"
echo "UID: $(id)"
echo ""

echo "=== 环境变量 ==="
env | grep -E "(FEISHU|DINGTALK|OPENCLAW)" | sort
echo ""

echo "=== 检查目录结构 ==="
echo "/app/extensions 目录:"
ls -la /app/extensions/ | head -10
echo ""

echo "/app/dist 目录:"
ls -la /app/dist/ | head -10
echo ""

echo "/app/dist/channels 目录:"
ls -la /app/dist/channels/ 2>/dev/null || echo "dist/channels 不存在"
echo ""

echo "=== 检查插件目录 ==="
for plugin in feishu dingtalk; do
    echo "--- 插件: $plugin ---"
    if [ -d "/app/extensions/$plugin" ]; then
        echo "✅ 源插件目录存在"
        echo "  内容:"
        ls -la /app/extensions/$plugin/ | head -10
        echo ""
        if [ -d "/app/extensions/$plugin/dist" ]; then
            echo "✅ 插件构建输出存在"
            echo "  构建输出内容:"
            ls -la /app/extensions/$plugin/dist/ | head -10
            echo ""
        else
            echo "❌ 插件构建输出不存在"
        fi
    else
        echo "❌ 源插件目录不存在"
    fi
    echo ""
done

echo "=== 检查工作区插件目录 ==="
echo "/tmp/workspace/.openclaw/extensions 目录:"
if [ -d "/tmp/workspace/.openclaw/extensions" ]; then
    ls -la /tmp/workspace/.openclaw/extensions/ | head -10
    echo ""
    echo "插件子目录:"
    ls -la /tmp/workspace/.openclaw/extensions/ 2>/dev/null || echo "插件目录不存在"
else
    echo "❌ 工作区插件目录不存在"
fi
echo ""

echo "=== 检查配置文件 ==="
if [ -f "/tmp/openclaw/openclaw.json" ]; then
    echo "✅ 配置文件存在"
    echo "配置内容预览:"
    cat /tmp/openclaw/openclaw.json | head -20
    echo ""
else
    echo "❌ 配置文件不存在"
fi
echo ""

echo "=== 检查权限 ==="
echo "/tmp/openclaw 权限:"
ls -ld /tmp/openclaw
echo ""
echo "/tmp/workspace 权限:"
ls -ld /tmp/workspace
echo ""
echo "/app/dist 权限:"
ls -ld /app/dist
echo ""

echo "=== 检查进程 ==="
echo "当前进程:"
ps aux | grep -E "(openclaw|node)" | grep -v grep
echo ""

echo "=== 调试完成 ==="