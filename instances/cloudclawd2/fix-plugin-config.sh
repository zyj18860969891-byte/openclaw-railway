#!/bin/bash

echo "=== 修复插件配置 ==="
echo "时间: $(date)"

CONFIG_FILE="/data/openclaw/openclaw.json"
WORKSPACE_EXTENSIONS="/tmp/workspace/.openclaw/extensions"

# 确保工作区扩展目录存在
mkdir -p "$WORKSPACE_EXTENSIONS"
# 确保持久化目录存在
mkdir -p "/data/openclaw"

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
echo "使用环境变量: OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN:0:10}..."
echo "使用环境变量: FEISHU_APP_ID=${FEISHU_APP_ID}"
echo "使用环境变量: DINGTALK_CLIENT_ID=${DINGTALK_CLIENT_ID}"

cat > "$CONFIG_FILE" << EOF
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "openrouter/stepfun/step-3.5-flash:free"
      },
      "workspace": "/tmp/openclaw",
      "sandbox": {
        "mode": "off"
      },
      "maxConcurrent": 4,
      "subagents": {
        "maxConcurrent": 8
      },
      "compaction": {
        "mode": "safeguard"
      }
    }
  },
  "gateway": {
    "mode": "local",
    "port": 8080,
    "bind": "lan",
    "auth": {
      "mode": "token",
      "token": "${OPENCLAW_GATEWAY_TOKEN}"
    },
    "trustedProxies": [
      "100.64.0.0/10",
      "23.227.167.3/32"
    ],
    "controlUi": {
      "enabled": true,
      "allowInsecureAuth": true,
      "dangerouslyDisableDeviceAuth": true,
      "basePath": "/"
    }
  },
  "browser": {
    "enabled": true,
    "executablePath": "/usr/bin/chromium",
    "headless": true,
    "noSandbox": true
  },
  "canvasHost": {
    "enabled": true
  },
  "logging": {
    "level": "info",
    "consoleStyle": "json"
  },
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
    "feishu": {
      "enabled": true,
      "appId": "${FEISHU_APP_ID}",
      "appSecret": "${FEISHU_APP_SECRET}",
      "connectionMode": "websocket",
      "dmPolicy": "open",
      "groupPolicy": "open"
    },
    "dingtalk": {
      "enabled": true,
      "clientId": "${DINGTALK_CLIENT_ID}",
      "clientSecret": "${DINGTALK_CLIENT_SECRET}",
      "connectionMode": "webhook",
      "dmPolicy": "open",
      "groupPolicy": "open"
    }
  },
  "skills": {
    "autoInstall": false,
    "requireUserConfirmation": false,
    "maxPerSession": 3,
    "install": {
      "nodeManager": "npm"
    }
  },
  "session": {
    "dmScope": "per-peer"
  }
}
EOF

echo "✅ 配置文件已生成"
echo "配置内容预览："
cat "$CONFIG_FILE" | head -20

# 设置环境变量
export OPENCLAW_STATE_DIR="/data/openclaw"
export OPENCLAW_WORKSPACE_DIR="/tmp/workspace"
export OPENCLAW_CONFIG_PATH="/data/openclaw/openclaw.json"
# 确保持久化目录存在
mkdir -p "/data/openclaw"
# 禁用自动技能安装功能（Railway 环境不支持 npx skills）
export OPENCLAW_SKILLS_AUTO_INSTALL="false"
export OPENCLAW_SKILLS_REQUIRE_CONFIRMATION="false"
export OPENCLAW_SKILLS_MAX_PER_SESSION="3"
# 启用浏览器功能（Railway 容器已安装 Chromium）
export OPENCLAW_BROWSER_ENABLED="true"
export OPENCLAW_BROWSER_EXECUTABLE="/usr/bin/chromium"
export OPENCLAW_BROWSER_HEADLESS="true"
export OPENCLAW_BROWSER_NO_SANDBOX="true"

# 预复制内置技能到工作区
echo "=== 预复制内置技能 ==="
SKILLS_SOURCE_DIR="/app/skills"
SKILLS_WORKSPACE_DIR="/tmp/workspace/.openclaw/skills"
SKILLS_PERSISTENT_DIR="/data/openclaw/skills"

if [ -d "$SKILLS_SOURCE_DIR" ]; then
    mkdir -p "$SKILLS_WORKSPACE_DIR"
    mkdir -p "$SKILLS_PERSISTENT_DIR"
    # 复制内置技能到工作区和持久化目录
    cp -r "$SKILLS_SOURCE_DIR"/* "$SKILLS_WORKSPACE_DIR/" 2>/dev/null || true
    cp -r "$SKILLS_SOURCE_DIR"/* "$SKILLS_PERSISTENT_DIR/" 2>/dev/null || true
    echo "✅ 内置技能已复制到工作区和持久化目录"
    echo "工作区技能目录: $SKILLS_WORKSPACE_DIR"
    echo "持久化技能目录: $SKILLS_PERSISTENT_DIR"
    ls -la "$SKILLS_WORKSPACE_DIR" | head -10
    ls -la "$SKILLS_PERSISTENT_DIR" | head -10
else
    echo "⚠️ 内置技能目录不存在: $SKILLS_SOURCE_DIR"
fi

echo "=== 环境变量已设置 ==="
echo "OPENCLAW_WORKSPACE_DIR: $OPENCLAW_WORKSPACE_DIR"
echo "OPENCLAW_CONFIG_PATH: $OPENCLAW_CONFIG_PATH"
echo "OPENCLAW_SKILLS_AUTO_INSTALL: $OPENCLAW_SKILLS_AUTO_INSTALL (disabled for Railway)"
echo "OPENCLAW_BROWSER_ENABLED: $OPENCLAW_BROWSER_ENABLED (Chromium headless mode)"
echo "持久化配置目录: /data/openclaw"
echo "持久化技能目录: $SKILLS_PERSISTENT_DIR"

echo "=== 修复完成 ==="