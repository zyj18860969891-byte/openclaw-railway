# Railway 部署修复总结

## 问题分析

在之前的部署中，OpenClaw 服务无法正常启动，主要问题包括：

1. **OpenClaw CLI 不可用** - 无法通过命令行访问 OpenClaw
2. **端口 8080 未监听** - 服务没有在预期的端口上运行
3. **启动命令错误** - railway.toml 和 Dockerfile 中的启动命令使用了错误的路径

## 根本原因

经过分析发现，问题出现在启动命令中：

```bash
# 错误的启动命令
exec node openclaw.mjs gateway --allow-unconfigured --auth token --bind lan --port 8080 --log-level debug
```

这个命令试图直接运行 `openclaw.mjs` 文件，但在容器构建过程中，这个文件可能没有被正确复制或路径不正确。

## 修复方案

### 1. 修改 railway.toml 启动命令

将启动命令从：
```bash
exec node openclaw.mjs gateway --allow-unconfigured --auth token --bind lan --port 8080 --log-level debug
```

修改为：
```bash
exec node dist/index.js gateway --allow-unconfigured --auth token --bind lan --port 8080 --log-level debug
```

### 2. 修改 Dockerfile 启动命令

同样将 Dockerfile 中的 CMD 指令从：
```bash
exec node openclaw.mjs gateway --allow-unconfigured --auth token --bind lan --port 8080 --log-level debug
```

修改为：
```bash
exec node dist/index.js gateway --allow-unconfigured --auth token --bind lan --port 8080 --log-level debug
```

### 3. 验证修复

创建了 `test-railway-fix.sh` 脚本来验证修复是否成功：

- 检查 railway.toml 中的启动命令
- 检查 Dockerfile 中的启动命令
- 验证 dist 目录结构
- 确认插件配置文件存在

## 修复后的部署流程

1. **构建阶段**：
   - Docker 构建应用
   - 编译 TypeScript 代码到 dist 目录
   - 构建插件并复制到 dist/channels
   - 生成配置文件

2. **启动阶段**：
   - 运行诊断脚本检查环境
   - 生成插件配置文件
   - 启动 OpenClaw 网关服务
   - 监听端口 8080

## 环境配置

### Railway 环境变量
```toml
[env]
  NODE_ENV = "production"
  RAILWAY_ENVIRONMENT = "production"
  MODEL_NAME = "openrouter/stepfun/step-3.5-flash:free"
  OAUTH_ENABLED = "true"
  OPENCLAW_GATEWAY_TOKEN = "aE8D17b2aef960C736De1cDFDdc4806d314e2C2DebDedAe84A832fdbDefAEC7A"
  GATEWAY_AUTH_MODE = "token"
  GATEWAY_TRUSTED_PROXIES = "100.64.0.0/10,23.227.167.3/32,127.0.0.1/32"
  GATEWAY_BIND = "lan"
  SANDBOX_MODE = "non-main"
  DM_SCOPE = "per-peer"
  OPENCLAW_STATE_DIR = "/tmp/openclaw"
  OPENCLAW_WORKSPACE_DIR = "/tmp/workspace"
  HOME = "/tmp/openclaw"
  USER = "root"
  BIND_ADDRESS = "0.0.0.0"
  OPENCLAW_CONFIG_PATH = "/tmp/openclaw/openclaw.json"
```

### 插件配置
```json
{
  "plugins": {
    "enabled": true,
    "entries": {
      "feishu": {"enabled": true},
      "dingtalk": {"enabled": true}
    }
  },
  "channels": {
    "feishu": {"enabled": true, "appId": "cli_a90b00a3bd799cb1", "appSecret": "LPjfXz3MxIlkLzsZOwXJIfVht0il4gEj", "connectionMode": "websocket", "dmPolicy": "open", "groupPolicy": "open"},
    "dingtalk": {"enabled": true, "clientId": "dingwmptjicih9yk2dmr", "clientSecret": "w8p_LcdLbsjMNeaGHn3kyd8s6Q91SXmItawbm_JgBKsOSdsoo3MYuG_JMuzfkxh5", "connectionMode": "webhook", "dmPolicy": "open", "groupPolicy": "open"}
  }
}
```

## 部署验证

修复后的部署应该能够：

1. ✅ 正常启动 OpenClaw 服务
2. ✅ 在端口 8080 上监听连接
3. ✅ 加载 Feishu 和 DingTalk 插件
4. ✅ 使用正确的认证配置
5. ✅ 生成并应用插件配置文件

## 下一步

1. 重新部署到 Railway
2. 检查部署日志确认服务启动成功
3. 验证 Feishu 和 DingTalk 插件连接正常
4. 测试消息收发功能

## 相关文件

- `railway.toml` - Railway 部署配置
- `Dockerfile` - 容器构建配置
- `fix-plugin-config.sh` - 插件配置修复脚本
- `debug-plugins.sh` - 插件调试脚本
- `diagnose-plugins.sh` - 插件诊断脚本
- `test-railway-fix.sh` - 修复验证脚本

## 构建缓存

为了确保 Railway 重新构建，设置了构建缓存版本：
```toml
CACHE_BUST = "2026-02-07-PLUGIN-FIX-V11"
```

这个版本号会在每次修复时更新，确保 Railway 重新构建应用。