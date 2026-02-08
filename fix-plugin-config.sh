#!/bin/bash

echo "=== 修复插件配置 ==="
echo "时间: $(date)"

CONFIG_FILE="/tmp/openclaw/openclaw.json"
WORKSPACE_EXTENSIONS="/tmp/workspace/.openclaw/extensions"

# 确保工作区扩展目录存在
mkdir -p "$WORKSPACE_EXTENSIONS"

# 检查插件是否已复制
echo "=== 检查插件复制状态 ==="
for plugin in feishu dingtalk; do
    plugin_dir="$WORKSPACE_EXTENSIONS/$plugin"
    if [ -d "$plugin_dir" ]; then
        echo "✅ $plugin 插件已复制到工作区"
        if [ -f "$plugin_dir/openclaw.plugin.json" ]; then
            echo "  ✅ 插件清单存在"
            cat "$plugin_dir/openclaw.plugin.json" | head -10
        else
            echo "  ❌ 插件清单不存在"
        fi
    else
        echo "❌ $plugin 插件未复制到工作区"
    fi
done

# 生成增强的配置文件，包含插件配置和自动技能安装配置
echo "=== 生成增强配置文件 ==="
cat > "$CONFIG_FILE" << 'EOF'
{
  "agents": {
    "defaults": {
      "model": {"primary": "openrouter/stepfun/step-3.5-flash:free"},
      "workspace": "/tmp/openclaw",
      "sandbox": {"mode": "non-main"}
    }
  },
  "gateway": {
    "mode": "local",
    "port": 8080,
    "bind": "lan",
    "auth": {"mode": "token", "token": "aE8D17b2aef960C736De1cDFDdc4806d314e2C2DebDedAe84A832fdbDefAEC7A"},
    "trustedProxies": ["100.64.0.0/10", "23.227.167.3/32"],
    "controlUi": {"enabled": true, "allowInsecureAuth": true, "dangerouslyDisableDeviceAuth": true}
  },
  "canvasHost": {"enabled": true},
  "logging": {"level": "info", "consoleStyle": "json"},
  "plugins": {
    "enabled": true,
    "entries": {
      "feishu": {
        "enabled": true
      },
      "dingtalk": {
        "enabled": true
      }
    }
  },
  "channels": {
    "feishu": {"enabled": true, "appId": "cli_a90b00a3bd799cb1", "appSecret": "LPjfXz3MxIlkLzsZOwXJIfVht0il4gEj", "connectionMode": "websocket", "dmPolicy": "open", "groupPolicy": "open"},
    "dingtalk": {"enabled": true, "clientId": "dingwmptjicih9yk2dmr", "clientSecret": "w8p_LcdLbsjMNeaGHn3kyd8s6Q91SXmItawbm_JgBKsOSdsoo3MYuG_JMuzfkxh5", "connectionMode": "webhook", "dmPolicy": "open", "groupPolicy": "open"}
  },
  "skills": {
    "install": {
      "preferBrew": false,
      "nodeManager": "npm"
    },
    "autoInstall": true
  }
}
EOF

echo "✅ 配置文件已生成"
echo "配置内容预览："
cat "$CONFIG_FILE" | head -20

# 设置环境变量
export OPENCLAW_STATE_DIR="/tmp/openclaw"
export OPENCLAW_WORKSPACE_DIR="/tmp/workspace"
export OPENCLAW_CONFIG_PATH="/tmp/openclaw/openclaw.json"
# 启用自动技能安装功能
export OPENCLAW_SKILLS_AUTO_INSTALL="true"
export OPENCLAW_SKILLS_REQUIRE_CONFIRMATION="false"
export OPENCLAW_SKILLS_MAX_PER_SESSION="3"

echo "=== 环境变量已设置 ==="
echo "OPENCLAW_WORKSPACE_DIR: $OPENCLAW_WORKSPACE_DIR"
echo "OPENCLAW_CONFIG_PATH: $OPENCLAW_CONFIG_PATH"
echo "OPENCLAW_SKILLS_AUTO_INSTALL: $OPENCLAW_SKILLS_AUTO_INSTALL"
echo "OPENCLAW_SKILLS_REQUIRE_CONFIRMATION: $OPENCLAW_SKILLS_REQUIRE_CONFIRMATION"
echo "OPENCLAW_SKILLS_MAX_PER_SESSION: $OPENCLAW_SKILLS_MAX_PER_SESSION"

echo "=== 修复完成 ==="