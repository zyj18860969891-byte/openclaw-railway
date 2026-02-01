# OpenClaw Railway 部署完整配置指南

## 问题修复总结

### 1. 权限问题修复
**问题**: `EACCES: permission denied, mkdir '/data/.openclaw'`

**解决方案**:
- 在 `Dockerfile` 中使用 `root` 用户运行
- 设置 `USER=root` 和 `HOME=/tmp/openclaw`
- 在 `railway.toml` 中添加 `USER=root`

### 2. 插件清单缺失修复
**问题**: `plugin manifest not found` 错误

**解决方案**:
- 创建 `fix-plugins.sh` 脚本生成基本的插件清单
- 在 `Dockerfile` 中运行修复脚本

### 3. 令牌认证实现（推荐）
**问题**: 密码认证不够安全

**解决方案**:
- 使用 `--auth token` 替代 `--auth password`
- 生成安全的随机令牌
- 设置 `GATEWAY_TOKEN` 环境变量

## Railway 配置文件

### railway.toml
```toml
[build]
  builder = "dockerfile"

[deploy]
  startCommand = "node dist/index.js gateway --allow-unconfigured --port 8080 --auth token --token $(openssl rand -hex 32)"
  restartPolicyType = "on_failure"
  restartPolicyMaxRetries = 3

[env]
  NODE_ENV = "production"
  PORT = "8080"
  MODEL_NAME = "anthropic/claude-opus-4-5"
  OAUTH_ENABLED = "true"
  GATEWAY_AUTH_MODE = "token"
  # 令牌认证（推荐）- 更安全的认证方式
  GATEWAY_TOKEN = "your_secure_token_here"
  SANDBOX_MODE = "non-main"
  DM_SCOPE = "per-peer"
  OPENCLAW_STATE_DIR = "/tmp/openclaw"
  OPENCLAW_WORKSPACE_DIR = "/tmp/workspace"
  # 修复权限问题
  HOME = "/tmp"
  USER = "root"
```

### Dockerfile 关键修改
```dockerfile
# 使用root用户运行以避免权限问题
USER root

# 修复插件清单问题
RUN chmod +x /app/fix-plugins.sh && /app/fix-plugins.sh

# 生成安全令牌
RUN chmod +x /app/generate-token.sh && /app/generate-token.sh
```

## 环境变量配置

### 模型提供商环境变量
```bash
# OpenRouter 支持
OPENROUTER_API_KEY=your_openrouter_api_key

# 其他模型提供商
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
MISTRAL_API_KEY=your_mistral_key
XAI_API_KEY=your_xai_key
```

### 通信渠道环境变量
```bash
# Discord
DISCORD_BOT_TOKEN=your_discord_bot_token

# Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Slack
SLACK_BOT_TOKEN=your_slack_bot_token

# WhatsApp
WHATSAPP_API_TOKEN=your_whatsapp_token

# Signal
SIGNAL_API_TOKEN=your_signal_token

# iMessage
IMESSAGE_API_TOKEN=your_imessage_token

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

## 安全令牌生成

### 方法1: 使用Railway环境变量
1. 在Railway控制台中添加环境变量：
   - `GATEWAY_TOKEN` = `your_secure_random_token`

### 方法2: 使用脚本生成
```bash
# 在本地生成令牌
openssl rand -hex 32

# 或使用提供的脚本
./generate-token.sh
```

### 方法3: 使用Railway的动态令牌
```toml
startCommand = "node dist/index.js gateway --allow-unconfigured --port 8080 --auth token --token $(openssl rand -hex 32)"
```

## 部署步骤

1. **提交更改**
   ```bash
   git add railway.toml Dockerfile fix-plugins.sh generate-token.sh
   git commit -m "修复权限问题和插件清单，实现令牌认证"
   git push
   ```

2. **部署到Railway**
   - Railway会自动检测到更改并重新部署
   - 查看部署日志确认修复成功

3. **验证部署**
   - 检查Railway日志确认没有权限错误
   - 确认插件清单错误已解决
   - 验证令牌认证正常工作

## 故障排除

### 如果仍然遇到权限问题
```bash
# 检查Railway环境变量
echo $HOME
echo $USER
echo $OPENCLAW_STATE_DIR

# 手动创建目录
mkdir -p /tmp/openclaw
chmod 755 /tmp/openclaw
```

### 如果插件清单问题仍然存在
```bash
# 手动检查插件清单
ls -la /app/extensions/*/openclaw.plugin.json

# 重新运行修复脚本
./fix-plugins.sh
```

### 如果令牌认证失败
```bash
# 检查令牌设置
echo $GATEWAY_TOKEN

# 重新生成令牌
openssl rand -hex 32
```

## 最佳实践

1. **定期更换令牌**: 建议每30天更换一次GATEWAY_TOKEN
2. **使用强密码**: 如果使用密码认证，确保使用强密码
3. **监控日志**: 定期检查Railway日志以发现潜在问题
4. **备份配置**: 保存重要的配置文件和环境变量
5. **测试环境**: 先在测试环境验证配置，再部署到生产环境

## 总结

通过以上修复，我们解决了：
- ✅ 权限问题（使用root用户）
- ✅ 插件清单缺失（创建基本清单文件）
- ✅ 实现了更安全的令牌认证
- ✅ 优化了Dockerfile配置
- ✅ 提供了完整的环境变量配置指南

现在您的OpenClaw部署应该能够正常运行，并且具有更好的安全性。