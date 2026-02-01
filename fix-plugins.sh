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
  "name": "dingtalk",
  "version": "1.0.0",
  "description": "DingTalk plugin for OpenClaw",
  "main": "index.js",
  "dependencies": {},
  "configSchema": {
    "type": "object",
    "properties": {
      "botToken": {
        "type": "string",
        "description": "DingTalk bot token"
      },
      "apiKey": {
        "type": "string",
        "description": "DingTalk API key"
      }
    }
  }
}
EOF

cat > /app/extensions/feishu/openclaw.plugin.json << 'EOF'
{
  "id": "feishu",
  "name": "feishu",
  "version": "1.0.0",
  "description": "Feishu plugin for OpenClaw",
  "main": "index.js",
  "dependencies": {},
  "configSchema": {
    "type": "object",
    "properties": {
      "appID": {
        "type": "string",
        "description": "Feishu app ID"
      },
      "appSecret": {
        "type": "string",
        "description": "Feishu app secret"
      }
    }
  }
}
EOF

cat > /app/extensions/wecom/openclaw.plugin.json << 'EOF'
{
  "id": "wecom",
  "name": "wecom",
  "version": "1.0.0",
  "description": "WeCom plugin for OpenClaw",
  "main": "index.js",
  "dependencies": {},
  "configSchema": {
    "type": "object",
    "properties": {
      "corpID": {
        "type": "string",
        "description": "WeCom corp ID"
      },
      "corpSecret": {
        "type": "string",
        "description": "WeCom corp secret"
      }
    }
  }
}
EOF

echo "插件清单修复完成"
echo "创建的插件清单文件："
ls -la /app/extensions/*/openclaw.plugin.json