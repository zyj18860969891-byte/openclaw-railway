# OpenClaw 多通道环境变量配置指南

本文档列出了所有通信通道的环境变量配置，可用于 Railway 或其他部署环境。

## 📋 目录

- [飞书 (Feishu)](#飞书)
- [钉钉 (DingTalk)](#钉钉)
- [企业微信 (WeCom)](#企业微信)
- [Telegram](#telegram)
- [Discord](#discord)
- [Slack](#slack)
- [iMessage](#imessage)
- [WhatsApp](#whatsapp)
- [Line](#line)

---

## 飞书

### 必需环境变量

```bash
# 启用飞书通道
FEISHU_ENABLED=true

# 飞书应用凭证
FEISHU_APP_ID=your_app_id_here
FEISHU_APP_SECRET=your_app_secret_here
```

### 可选配置

```bash
# 连接模式（目前仅支持 websocket）
FEISHU_CONNECTION_MODE=websocket

# 私聊策略：open（开放）、pairing（配对）、allowlist（白名单）
FEISHU_DM_POLICY=open

# 群组策略：open（开放）、allowlist（白名单）、disabled（禁用）
FEISHU_GROUP_POLICY=open

# 是否需要 @ 提及才能响应
FEISHU_REQUIRE_MENTION=false

# 允许的来源用户 ID 列表（JSON 数组）
FEISHU_ALLOW_FROM=["user1_id","user2_id"]

# 群组允许的来源列表（JSON 数组）
FEISHU_GROUP_ALLOW_FROM=["group1_id","group2_id"]

# 是否将 Markdown 作为卡片发送
FEISHU_SEND_MARKDOWN_AS_CARD=false

# 历史消息限制
FEISHU_HISTORY_LIMIT=100

# 文本分块限制
FEISHU_TEXT_CHUNK_LIMIT=1
```

---

## 钉钉

### 必需环境变量

```bash
# 启用钉钉通道
DINGTALK_ENABLED=true

# 钉钉应用凭证
DINGTALK_CLIENT_ID=your_client_id_here
DINGTALK_CLIENT_SECRET=your_client_secret_here
```

### 可选配置

```bash
# 连接模式：stream（流式）或 webhook（Webhook）
DINGTALK_CONNECTION_MODE=stream

# 私聊策略：open、pairing、allowlist
DINGTALK_DM_POLICY=open

# 群组策略：open、allowlist、disabled
DINGTALK_GROUP_POLICY=open

# 是否需要 @ 提及
DINGTALK_REQUIRE_MENTION=false

# 允许的来源用户列表（JSON 数组）
DINGTALK_ALLOW_FROM=["user_id1","user_id2"]

# 群组允许的来源列表（JSON 数组）
DINGTALK_GROUP_ALLOW_FROM=["group_id1","group_id2"]

# 历史消息限制
DINGTALK_HISTORY_LIMIT=100

# 文本分块限制
DINGTALK_TEXT_CHUNK_LIMIT=1
```

---

## 企业微信 (WeCom)

### 必需环境变量

```bash
# 启用企业微信通道
WECOM_ENABLED=true

# 企业微信应用凭证
WECOM_TOKEN=your_token_here
WECOM_ENCODING_AES_KEY=your_encoding_aes_key_here
WECOM_WEBHOOK_PATH=/wecom/webhook
WECOM_RECEIVE_ID=your_receive_id_here
```

### 可选配置

```bash
# 通道名称
WECOM_NAME=企业微信

# 欢迎文本
WECOM_WELCOME_TEXT=你好，我是 OpenClaw 助手

# 私聊策略：open、pairing、allowlist、disabled
WECOM_DM_POLICY=open

# 群组策略：open、allowlist、disabled
WECOM_GROUP_POLICY=open

# 是否需要 @ 提及
WECOM_REQUIRE_MENTION=false

# 允许的来源用户列表（JSON 数组）
WECOM_ALLOW_FROM=["user_id1","user_id2"]

# 群组允许的来源列表（JSON 数组）
WECOM_GROUP_ALLOW_FROM=["group_id1","group_id2"]

# 默认账户
WECOM_DEFAULT_ACC0UNT=default

# 多账户配置（JSON 对象）
# 格式：{"account1": {"name":"账户1","token":"token1","enabled":true}, "account2": {...}}
WECOM_ACCOUNTS={}
```

---

## Telegram

### 必需环境变量

```bash
# 启用 Telegram 通道
TELEGRAM_ENABLED=true
```

### 可选配置

```bash
# Telegram Bot Token（如果需要在 Telegram 中接收消息）
TELEGRAM_BOT_TOKEN=your_bot_token_here

# 允许的用户 ID 列表（JSON 数组）
TELEGRAM_ALLOW_FROM=["user_id1","user_id2"]

# 私聊策略
TELEGRAM_DM_POLICY=open

# 群组策略
TELEGRAM_GROUP_POLICY=open

# 是否需要 @ 提及
TELEGRAM_REQUIRE_MENTION=false
```

---

## Discord

### 必需环境变量

```bash
# 启用 Discord 通道
DISCORD_ENABLED=true
```

### 可选配置

```bash
# Discord Bot Token
DISCORD_BOT_TOKEN=your_bot_token_here

# 允许的服务器 ID 列表（JSON 数组）
DISCORD_ALLOW_GUILDS=["guild_id1","guild_id2"]

# 允许的用户 ID 列表（JSON 数组）
DISCORD_ALLOW_FROM=["user_id1","user_id2"]

# 私聊策略
DISCORD_DM_POLICY=open

# 群组策略
DISCORD_GROUP_POLICY=open

# 是否需要 @ 提及
DISCORD_REQUIRE_MENTION=false
```

---

## Slack

### 必需环境变量

```bash
# 启用 Slack 通道
SLACK_ENABLED=true
```

### 可选配置

```bash
# Slack Bot Token
SLACK_BOT_TOKEN=xoxb-your-bot-token

# Slack App Level Token（用于 Socket Mode）
SLACK_APP_TOKEN=xapp-your-app-token

# 允许的工作空间 ID
SLACK_ALLOW_TEAMS=["T12345678"]

# 允许的用户 ID 列表（JSON 数组）
SLACK_ALLOW_FROM=["U12345678"]

# 私聊策略
SLACK_DM_POLICY=open

# 群组策略
SLACK_GROUP_POLICY=open

# 是否需要 @ 提及
SLACK_REQUIRE_MENTION=false
```

---

## iMessage

### 必需环境变量

```bash
# 启用 iMessage 通道
IMESSAGE_ENABLED=true
```

### 可选配置

```bash
# iMessage 凭据（如果需要）
IMESSAGE_APPLE_ID=your_apple_id@icloud.com
IMESSAGE_APP_SPECIFIC_PASSWORD=your_app_specific_password

# 允许的发送者列表（JSON 数组）
IMESSAGE_ALLOW_FROM=["+8613900000000"]

# 私聊策略
IMESSAGE_DM_POLICY=open

# 是否需要 @ 提及（iMessage 不支持，忽略）
IMESSAGE_REQUIRE_MENTION=false
```

---

## WhatsApp

### 必需环境变量

```bash
# 启用 WhatsApp 通道
WHATSAPP_ENABLED=true
```

### 可选配置

```bash
# WhatsApp Business API Token
WHATSAPP_API_TOKEN=your_api_token

# WhatsApp Business Phone Number ID
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# WhatsApp Business Account ID
WHATSAPP_ACCOUNT_ID=your_account_id

# Webhook 验证令牌
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token

# 允许的电话号码列表（JSON 数组）
WHATSAPP_ALLOW_FROM=["+8613900000000"]

# 私聊策略
WHATSAPP_DM_POLICY=open
```

---

## Line

### 必需环境变量

```bash
# 启用 Line 通道
LINE_ENABLED=true
```

### 可选配置

```bash
# Line Bot Channel Access Token
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token

# Line Bot Channel Secret
LINE_CHANNEL_SECRET=your_channel_secret

# 允许的用户 ID 列表（JSON 数组）
LINE_ALLOW_FROM=["user_id1","user_id2"]

# 私聊策略
LINE_DM_POLICY=open

# 群组策略
LINE_GROUP_POLICY=open

# 是否需要 @ 提及
LINE_REQUIRE_MENTION=false
```

---

## 🚀 快速配置示例

### 示例 1：仅启用飞书

```bash
FEISHU_ENABLED=true
FEISHU_APP_ID=cli_xxxxx
FEISHU_APP_SECRET=your_secret
```

### 示例 2：同时启用飞书和钉钉

```bash
# 飞书
FEISHU_ENABLED=true
FEISHU_APP_ID=cli_xxxxx
FEISHU_APP_SECRET=your_secret

# 钉钉
DINGTALK_ENABLED=true
DINGTALK_CLIENT_ID=your_dingtalk_app_key
DINGTALK_CLIENT_SECRET=your_dingtalk_app_secret
```

### 示例 3：启用所有通道

```bash
# 飞书
FEISHU_ENABLED=true
FEISHU_APP_ID=cli_xxxxx
FEISHU_APP_SECRET=your_secret

# 钉钉
DINGTALK_ENABLED=true
DINGTALK_CLIENT_ID=your_dingtalk_app_key
DINGTALK_CLIENT_SECRET=your_dingtalk_app_secret

# 企业微信
WECOM_ENABLED=true
WECOM_TOKEN=your_token
WECOM_ENCODING_AES_KEY=your_encoding_aes_key
WECOM_WEBHOOK_PATH=/wecom/webhook
WECOM_RECEIVE_ID=your_receive_id

# Telegram
TELEGRAM_ENABLED=true
TELEGRAM_BOT_TOKEN=your_bot_token

# Discord
DISCORD_ENABLED=true
DISCORD_BOT_TOKEN=your_bot_token

# Slack
SLACK_ENABLED=true
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_APP_TOKEN=xapp-your-token

# iMessage
IMESSAGE_ENABLED=true

# WhatsApp
WHATSAPP_ENABLED=true
WHATSAPP_API_TOKEN=your_api_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id

# Line
LINE_ENABLED=true
LINE_CHANNEL_ACCESS_TOKEN=your_token
LINE_CHANNEL_SECRET=your_secret
```

---

## ⚠️ 注意事项

1. **环境变量命名**：所有环境变量使用大写字母和下划线
2. **敏感信息**：`*_SECRET`、`*_TOKEN`、`*_KEY` 等字段是敏感信息，请妥善保管
3. **必需 vs 可选**：每个通道都有必需的环境变量，缺少必需变量会导致该通道无法启动
4. **JSON 格式**：列表类型的配置需要提供有效的 JSON 数组
5. **优先级**：环境变量会覆盖配置文件中的设置
6. **重启生效**：添加或修改环境变量后需要重启服务才能生效

---

## 📚 参考文档

- [OpenClaw 动态插件系统指南](./dynamic-plugin-system-guide.md)
- [OpenClaw 部署指南](./Railway部署指南.md)
- [OpenClaw 配置文档](./docs.acp.md)

---

最后更新：2026-02-06
