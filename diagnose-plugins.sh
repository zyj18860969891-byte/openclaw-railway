#!/bin/bash

echo "=== OpenClaw 插件诊断报告 ==="
echo "时间: $(date)"
echo "容器ID: $(cat /etc/hostname 2>/dev/null || echo 'unknown')"
echo "================================"

echo ""
echo "## 1. 环境变量检查"
echo "FEISHU_ENABLED: ${FEISHU_ENABLED:-'未设置'}"
echo "DINGTALK_ENABLED: ${DINGTALK_ENABLED:-'未设置'}"
echo "OPENCLAW_WORKSPACE_DIR: ${OPENCLAW_WORKSPACE_DIR:-'未设置'}"
echo "OPENCLAW_CONFIG_PATH: ${OPENCLAW_CONFIG_PATH:-'未设置'}"
echo "NODE_ENV: ${NODE_ENV:-'未设置'}"

echo ""
echo "## 2. 目录结构检查"
echo "### 应用目录"
echo "/app 内容:"
ls -la /app/ | head -10
echo ""

echo "### 插件源目录"
if [ -d "/app/extensions" ]; then
    echo "✅ /app/extensions 存在"
    echo "插件列表:"
    ls /app/extensions/ | grep -E "(feishu|dingtalk)" | head -5
    echo ""
    
    for plugin in feishu dingtalk; do
        if [ -d "/app/extensions/$plugin" ]; then
            echo "#### 插件: $plugin"
            echo "源目录内容:"
            ls -la /app/extensions/$plugin/ | head -10
            echo ""
            
            if [ -d "/app/extensions/$plugin/dist" ]; then
                echo "构建输出内容:"
                ls -la /app/extensions/$plugin/dist/ | head -10
                echo ""
            else
                echo "❌ 构建输出目录不存在"
            fi
        fi
    done
else
    echo "❌ /app/extensions 不存在"
fi

echo ""
echo "### 工作区插件目录"
if [ -d "/tmp/workspace/.openclaw/extensions" ]; then
    echo "✅ /tmp/workspace/.openclaw/extensions 存在"
    echo "工作区插件内容:"
    ls -la /tmp/workspace/.openclaw/extensions/ | head -10
    echo ""
    
    for plugin in feishu dingtalk; do
        if [ -d "/tmp/workspace/.openclaw/extensions/$plugin" ]; then
            echo "#### 工作区插件: $plugin"
            echo "内容:"
            ls -la /tmp/workspace/.openclaw/extensions/$plugin/ | head -10
            echo ""
            
            if [ -f "/tmp/workspace/.openclaw/extensions/$plugin/openclaw.plugin.json" ]; then
                echo "插件清单:"
                cat /tmp/workspace/.openclaw/extensions/$plugin/openclaw.plugin.json
                echo ""
            else
                echo "❌ 插件清单不存在"
            fi
        fi
    done
else
    echo "❌ /tmp/workspace/.openclaw/extensions 不存在"
fi

echo ""
echo "## 3. 配置文件检查"
if [ -f "/tmp/openclaw/openclaw.json" ]; then
    echo "✅ 配置文件存在"
    echo "配置内容:"
    cat /tmp/openclaw/openclaw.json | python3 -m json.tool 2>/dev/null || cat /tmp/openclaw/openclaw.json
    echo ""
else
    echo "❌ 配置文件不存在"
fi

echo ""
echo "## 4. 权限检查"
echo "### 目录权限"
echo "/tmp/openclaw: $(ls -ld /tmp/openclaw)"
echo "/tmp/workspace: $(ls -ld /tmp/workspace)"
echo "/app: $(ls -ld /app)"
echo ""

echo "### 文件权限"
echo "配置文件权限:"
if [ -f "/tmp/openclaw/openclaw.json" ]; then
    ls -la /tmp/openclaw/openclaw.json
fi
echo ""

echo "### 脚本权限"
ls -la /app/*.sh | head -5
echo ""

echo "## 5. 进程检查"
echo "当前运行进程:"
ps aux | grep -E "(openclaw|node)" | grep -v grep
echo ""

echo "## 6. 网络检查"
echo "监听端口:"
netstat -tlnp 2>/dev/null | grep :8080 || echo "未找到监听8080端口的进程"
echo ""

echo "## 7. 插件发现测试"
echo "尝试查找插件..."
if command -v openclaw >/dev/null 2>&1; then
    echo "OpenClaw CLI 可用，尝试列出插件:"
    openclaw plugins list 2>/dev/null || echo "OpenClaw CLI 插件列表命令失败"
else
    echo "OpenClaw CLI 不可用"
fi
echo ""

echo "## 8. 日志摘要"
echo "最近的系统日志:"
tail -20 /tmp/openclaw/openclaw-*.log 2>/dev/null || echo "未找到日志文件"
echo ""

echo "=== 诊断完成 ==="