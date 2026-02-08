import json

feishu_content = '''{
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
  },
  "uiHints": {
    "appId": { "label": "App ID" },
    "appSecret": { "label": "App Secret", "sensitive": true }
  }
}
'''

# 写入临时文件
with open('temp_feishu.json', 'w', encoding='utf-8') as f:
    f.write(feishu_content)

# 验证JSON
try:
    with open('temp_feishu.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    print('fix-plugins.sh 生成的飞书插件JSON是有效的')
    print(f'JSON结构: {list(data.keys())}')
except json.JSONDecodeError as e:
    print(f'fix-plugins.sh 生成的飞书插件JSON无效: {e}')
    print(f'错误位置: {e.pos}')
    # 显示错误位置附近的字符
    if e.pos:
        start = max(0, e.pos - 50)
        end = min(len(feishu_content), e.pos + 50)
        print(f'上下文: {repr(feishu_content[start:end])}')