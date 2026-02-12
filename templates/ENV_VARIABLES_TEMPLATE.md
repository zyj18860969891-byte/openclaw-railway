# OpenClaw 新服务环境变量配置模板

## 使用说明

1. **复制此文件**到新实例目录（如 `instances/cloudclawd3/ENV_VARIABLES.txt`）
2. **修改实例名称**和相关配置
3. **在 Railway Dashboard → Variables 中添加以下变量**

## 快速复制版（直接复制到 Railway Variables）

```plaintext
NODE_ENV=production
RAILWAY_ENVIRONMENT=production
MODEL_NAME=openrouter/stepfun/step-3.5-flash:free
OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY
GATEWAY_AUTH_MODE=token
OPENCLAW_GATEWAY_TOKEN=YOUR_UNIQUE_TOKEN_HERE
FEISHU_ENABLED=true
DINGTALK_ENABLED=true
WECOM_ENABLED=false
TELEGRAM_ENABLED=false
DISCORD_ENABLED=false
SLACK_ENABLED=false
FEISHU_APP_ID=YOUR_FEISHU_APP_ID
FEISHU_APP_SECRET=YOUR_FEISHU_APP_SECRET
DINGTALK_CLIENT_ID=YOUR_DINGTALK_CLIENT_ID
DINGTALK_CLIENT_SECRET=YOUR_DINGTALK_CLIENT_SECRET
GATEWAY_BIND=lan
GATEWAY_TRUSTED_PROXIES=100.64.0.0/10,127.0.0.1/32
DM_SCOPE=per-peer
GATEWAY_WEBSOCKET_TIMEOUT=3600000
GATEWAY_WEBSOCKET_MAX_CONNECTIONS=100
GATEWAY_WEBSOCKET_HEARTBEAT=30000
GATEWAY_RATE_LIMIT=200/minute
GATEWAY_CONCURRENT_CONNECTIONS=100
GATEWAY_MESSAGE_QUEUE_SIZE=3000
GATEWAY_SESSION_CLEANUP_INTERVAL=300000
OPENCLAW_BROWSER_ENABLED=true
OPENCLAW_BROWSER_EXECUTABLE=/usr/bin/chromium
OPENCLAW_BROWSER_HEADLESS=true
OPENCLAW_BROWSER_NO_SANDBOX=true
OPENCLAW_SKILLS_AUTO_INSTALL=true
OPENCLAW_SKILLS_REQUIRE_CONFIRMATION=false
OPENCLAW_SKILLS_MAX_PER_SESSION=3
LOG_LEVEL=info
OPENCLAW_LOGGING_LEVEL=info
OPENCLAW_STATE_DIR=/data/openclaw
OPENCLAW_WORKSPACE_DIR=/tmp/workspace
OPENCLAW_CONFIG_PATH=/data/openclaw/openclaw.json
```

## 必需配置（必须手动设置）

### === 基础配置 ===
```plaintext
NODE_ENV=production
RAILWAY_ENVIRONMENT=production
MODEL_NAME=openrouter/stepfun/step-3.5-flash:free
```

### === Gateway 认证 ===
```plaintext
GATEWAY_AUTH_MODE=token
OPENCLAW_GATEWAY_TOKEN=YOUR_UNIQUE_TOKEN_HERE
```

**重要**：生成唯一 Token：
```bash
openssl rand -hex 32
```

### === 通道开关 ===
```plaintext
FEISHU_ENABLED=true
DINGTALK_ENABLED=true
WECOM_ENABLED=false
TELEGRAM_ENABLED=false
DISCORD_ENABLED=false
SLACK_ENABLED=false
```

## ⚠️ 用户凭证配置（需要新用户填写）

### === AI 模型配置 ===
```plaintext
OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY
```

### === 飞书凭证 ===
```plaintext
FEISHU_APP_ID=YOUR_FEISHU_APP_ID
FEISHU_APP_SECRET=YOUR_FEISHU_APP_SECRET
```

### === 钉钉凭证 ===
```plaintext
DINGTALK_CLIENT_ID=YOUR_DINGTALK_CLIENT_ID
DINGTALK_CLIENT_SECRET=YOUR_DINGTALK_CLIENT_SECRET
```

## 系统配置（保持默认即可）

### === Gateway 配置 ===
```plaintext
GATEWAY_BIND=lan
GATEWAY_TRUSTED_PROXIES=100.64.0.0/10,127.0.0.1/32
DM_SCOPE=per-peer
```

### === WebSocket 配置 ===
```plaintext
GATEWAY_WEBSOCKET_TIMEOUT=3600000
GATEWAY_WEBSOCKET_MAX_CONNECTIONS=100
GATEWAY_WEBSOCKET_HEARTBEAT=30000
```

### === 资源限制 ===
```plaintext
GATEWAY_RATE_LIMIT=200/minute
GATEWAY_CONCURRENT_CONNECTIONS=100
GATEWAY_MESSAGE_QUEUE_SIZE=3000
GATEWAY_SESSION_CLEANUP_INTERVAL=300000
```

### === 浏览器配置 ===
```plaintext
OPENCLAW_BROWSER_ENABLED=true
OPENCLAW_BROWSER_EXECUTABLE=/usr/bin/chromium
OPENCLAW_BROWSER_HEADLESS=true
OPENCLAW_BROWSER_NO_SANDBOX=true
```

### === 技能配置 ===
```plaintext
OPENCLAW_SKILLS_AUTO_INSTALL=true
OPENCLAW_SKILLS_REQUIRE_CONFIRMATION=false
OPENCLAW_SKILLS_MAX_PER_SESSION=3
```

### === 日志配置 ===
```plaintext
LOG_LEVEL=info
OPENCLAW_LOGGING_LEVEL=info
```

### === 持久化配置 ===
```plaintext
OPENCLAW_STATE_DIR=/data/openclaw
OPENCLAW_WORKSPACE_DIR=/tmp/workspace
OPENCLAW_CONFIG_PATH=/data/openclaw/openclaw.json
```

## 验证配置

部署后，检查日志确认配置正确：
```bash
railway logs
```

应该看到：
- ✅ 环境变量正确加载
- ✅ 通道配置正确
- ✅ Gateway Token 正确设置
- ✅ Python 依赖安装成功（查看构建日志）

## 常见问题

### Q1: 如何生成唯一的 Gateway Token？
**A**: 运行以下命令：
```bash
openssl rand -hex 32
```
然后将生成的 64 字符十六进制字符串填入 `OPENCLAW_GATEWAY_TOKEN`。

### Q2: 如何获取飞书凭证？
**A**: 
1. 访问 [飞书开放平台](https://open.feishu.cn/app)
2. 创建企业自建应用
3. 获取 App ID 和 App Secret

### Q3: 如何获取钉钉凭证？
**A**: 
1. 访问 [钉钉开放平台](https://open-dev.dingtalk.com/)
2. 创建企业内部应用
3. 获取 Client ID 和 Client Secret

### Q4: 为什么需要设置 `OPENCLAW_WORKSPACE_DIR=/tmp/workspace`？
**A**: Railway 的持久化卷挂载在 `/data/openclaw`，但工作区需要在 `/tmp/workspace` 以确保正确的权限和性能。

### Q5: 如何验证新服务部署成功？
**A**: 
1. 检查构建日志，确认 Python 依赖安装成功
2. 检查启动日志，确认服务正常启动
3. 发送测试消息，验证技能执行正常

## 安全建议

1. **不要提交真实凭证**到代码仓库
2. **使用 Railway Dashboard** 设置敏感环境变量
3. **定期轮换 Token** 和 API Key
4. **使用不同的 Token** 为每个服务实例

## 总结

✅ **此模板已包含所有必要配置**：
- 基础配置（环境、模型）
- 通道配置（飞书、钉钉）
- Gateway 配置（认证、WebSocket）
- 系统配置（浏览器、技能、日志）

✅ **未来创建新实例时**：
1. 复制此模板到新实例目录
2. 修改实例名称和 Token
3. 填写用户凭证
4. 部署到 Railway

这样可以确保新实例不会出现配置缺失或错误的问题。