#!/bin/bash

# 修复OpenClaw插件清单缺失问题
# 这个脚本会创建缺失的插件清单文件

echo "正在修复OpenClaw插件清单问题..."

# 创建插件清单目录
mkdir -p /app/extensions/dingtalk
mkdir -p /app/extensions/feishu
mkdir -p /app/extensions/wecom

# 创建基本的插件清单文件
cat > /app/extensions/dingtalk/openclaw.plugin.json << 'EOF'
{
  "id": "dingtalk",
  "name": "DingTalk",
  "version": "0.1.0",
  "description": "钉钉消息渠道插件",
  "channels": ["dingtalk"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "enabled": { "type": "boolean" },
      "clientId": { "type": "string" },
      "clientSecret": { "type": "string" },
      "connectionMode": { "type": "string", "enum": ["stream", "webhook"] },
      "dmPolicy": { "type": "string", "enum": ["open", "pairing", "allowlist"] },
      "groupPolicy": { "type": "string", "enum": ["open", "allowlist", "disabled"] },
      "requireMention": { "type": "boolean" },
      "allowFrom": { "type": "array", "items": { "type": "string" } },
      "groupAllowFrom": { "type": "array", "items": { "type": "string" } },
      "historyLimit": { "type": "integer", "minimum": 0 },
      "textChunkLimit": { "type": "integer", "minimum": 1 }
    }
  },
  "uiHints": {
    "clientId": { "label": "Client ID (AppKey)" },
    "clientSecret": { "label": "Client Secret (AppSecret)", "sensitive": true }
  }
}
EOF

cat > /app/extensions/feishu/openclaw.plugin.json << 'EOF'
{
  "id": "feishu",
  "name": "Feishu",
  "description": "飞书/Lark 消息渠道插件",
  "version": "0.1.5",
  "channels": ["feishu"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "enabled": {
        "type": "boolean",
        "description": "是否启用飞书通道"
      },
      "appId": {
        "type": "string",
        "description": "飞书应用 ID (App ID)"
      },
      "appSecret": {
        "type": "string",
        "description": "飞书应用密钥 (App Secret)",
        "sensitive": true
      },
      "connectionMode": {
        "type": "string",
        "enum": ["websocket"],
        "description": "连接模式"
      },
      "dmPolicy": {
        "type": "string",
        "enum": ["open", "pairing", "allowlist"],
        "description": "私聊策略"
      },
      "groupPolicy": {
        "type": "string",
        "enum": ["open", "allowlist", "disabled"],
        "description": "群组策略"
      },
      "requireMention": {
        "type": "boolean",
        "description": "是否需要@提及"
      },
      "allowFrom": {
        "type": "array",
        "items": { "type": "string" },
        "description": "允许的来源用户列表"
      },
      "groupAllowFrom": {
        "type": "array",
        "items": { "type": "string" },
        "description": "群组允许的来源列表"
      },
      "sendMarkdownAsCard": {
        "type": "boolean",
        "description": "是否将Markdown消息发送为卡片"
      },
      "historyLimit": {
        "type": "integer",
        "minimum": 0,
        "description": "历史消息限制"
      },
      "textChunkLimit": {
        "type": "integer",
        "minimum": 1,
        "description": "文本分块限制"
      }
    }
  },
  "uiHints": {
    "appId": { "label": "App ID" },
    "appSecret": { "label": "App Secret", "sensitive": true }
  }
}
EOF

cat > /app/extensions/wecom/openclaw.plugin.json << 'EOF'
{
  "id": "wecom",
  "name": "WeCom",
  "description": "企业微信消息渠道插件",
  "version": "0.1.0",
  "channels": ["wecom"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "enabled": { "type": "boolean" },
      "corpId": { "type": "string" },
      "corpSecret": { "type": "string" },
      "connectionMode": { "type": "string", "enum": ["webhook"] },
      "dmPolicy": { "type": "string", "enum": ["open", "pairing", "allowlist"] },
      "groupPolicy": { "type": "string", "enum": ["open", "allowlist", "disabled"] },
      "requireMention": { "type": "boolean" },
      "allowFrom": { "type": "array", "items": { "type": "string" } },
      "groupAllowFrom": { "type": "array", "items": { "type": "string" } },
      "historyLimit": { "type": "integer", "minimum": 0 },
      "textChunkLimit": { "type": "integer", "minimum": 1 }
    }
  },
  "uiHints": {
    "corpId": { "label": "Corp ID" },
    "corpSecret": { "label": "Corp Secret", "sensitive": true }
  }
}
EOF

echo "插件清单修复完成"
echo "创建的插件清单文件："
ls -la /app/extensions/*/openclaw.plugin.json