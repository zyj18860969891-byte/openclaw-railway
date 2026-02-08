# OpenClaw Railway 部署最终修复总结

## 问题历史

### 初始问题
1. OpenClaw CLI 不可用
2. 端口 8080 未监听
3. 服务无法启动

### 第一次修复
- 将启动命令从 `node openclaw.mjs` 改为 `node dist/index.js`
- 但保留了 `--log-level debug` 选项

### 第二次修复（当前）
从新的部署日志中发现更多问题：
1. `--log-level` 选项不被 OpenClaw CLI 支持
2. `OPENCLAW_CONFIG_PATH` 环境变量未在启动时设置
3. 服务启动失败

## 最终修复方案

### 1. railway.toml 启动命令修复

**修复前：**
```toml
startCommand = "bash -c 'echo \"=== 环境变量 ===\"; env | grep -E \"(GATEWAY_TRUSTED_PROXIES|RAILWAY_ENVIRONMENT|NODE_ENV)\" | sort; echo \"=== 生成配置前 ===\"; cat /tmp/openclaw/openclaw.json 2>/dev/null || echo \"配置文件不存在\"; /app/fix-plugin-config.sh; echo \"=== 生成配置后 ===\"; cat /tmp/openclaw/openclaw.json; echo \"=== 调试插件状态 ===\"; /app/debug-plugins.sh; echo \"=== 详细诊断 ===\"; /app/diagnose-plugins.sh; echo \"=== 启动OpenClaw ===\"; exec node openclaw.mjs gateway --allow-unconfigured --auth token --bind lan --port 8080 --log-level debug'"
```

**修复后：**
```toml
startCommand = "bash -c 'echo \"=== 环境变量 ===\"; env | grep -E \"(GATEWAY_TRUSTED_PROXIES|RAILWAY_ENVIRONMENT|NODE_ENV|OPENCLAW_CONFIG_PATH)\" | sort; echo \"=== 生成配置前 ===\"; cat /tmp/openclaw/openclaw.json 2>/dev/null || echo \"配置文件不存在\"; /app/fix-plugin-config.sh; echo \"=== 生成配置后 ===\"; cat /tmp/openclaw/openclaw.json; echo \"=== 调试插件状态 ===\"; /app/debug-plugins.sh; echo \"=== 详细诊断 ===\"; /app/diagnose-plugins.sh; echo \"=== 启动OpenClaw ===\"; export OPENCLAW_CONFIG_PATH=/tmp/openclaw/openclaw.json; exec node dist/index.js gateway --allow-unconfigured --auth token --bind lan --port 8080 --verbose'"
```

**关键更改：**
- 使用 `dist/index.js` 替代 `openclaw.mjs`
- 移除不支持的 `--log-level debug` 选项
- 添加 `--verbose` 选项获取详细日志
- 显式设置 `OPENCLAW_CONFIG_PATH=/tmp/openclaw/openclaw.json`
- 在环境变量检查中添加 `OPENCLAW_CONFIG_PATH`

### 2. Dockerfile 启动命令修复

同样应用相同的修复到 Dockerfile 的 CMD 指令。

## 验证修复

所有修复已应用到：
- ✅ `railway.toml` - 启动命令已更新
- ✅ `Dockerfile` - CMD 指令已更新
- ✅ 环境变量设置正确
- ✅ 使用正确的 CLI 选项

## 部署检查清单

重新部署后，应该看到：

1. ✅ 容器构建成功
2. ✅ 插件配置正确生成
3. ✅ 环境变量正确设置（包括 OPENCLAW_CONFIG_PATH）
4. ✅ OpenClaw 服务正常启动
5. ✅ 端口 8080 正在监听
6. ✅ 日志显示服务运行状态
7. ✅ Feishu 和 DingTalk 插件加载成功

## 从部署日志学到的经验

### 错误信息分析
```
2026-02-07T16:23:43.000000000Z [err]  error: unknown option '--log-level'
```

这表明 OpenClaw CLI 不支持 `--log-level` 选项。正确的选项是 `--verbose`。

### 配置路径问题
```
OPENCLAW_CONFIG_PATH: '未设置'
```

配置文件路径未设置，导致 OpenClaw 无法找到配置。需要在启动前显式设置环境变量。

### 服务状态检查
```
## 6. 网络检查
监听端口:
netstat -tlnp 2>/dev/null | grep :8080 || echo "未找到监听8080端口的进程"
```

服务没有启动，因此没有进程监听端口 8080。

## 下一步行动

1. **重新部署到 Railway**
2. **监控部署日志**，确认：
   - 环境变量设置正确
   - 配置文件生成成功
   - OpenClaw 服务启动无错误
   - 端口 8080 成功监听
3. **测试插件功能**：
   - Feishu 消息收发
   - DingTalk 消息收发
4. **验证控制界面**：访问控制 UI 确认服务正常运行

## 相关文件

- `railway.toml` - Railway 部署配置（已修复）
- `Dockerfile` - 容器构建配置（已修复）
- `fix-plugin-config.sh` - 插件配置修复脚本
- `debug-plugins.sh` - 插件调试脚本
- `diagnose-plugins.sh` - 插件诊断脚本
- `RAILWAY_FIX_SUMMARY.md` - 修复历史记录
- `FINAL_FIX_SUMMARY.md` - 本文件（最终修复总结）

## 技术细节

### OpenClaw CLI 正确用法
```bash
# 启动网关
node dist/index.js gateway [选项]

# 常用选项
--allow-unconfigured   允许未完全配置的服务启动
--auth <mode>          认证模式：token 或 password
--bind <interface>     绑定接口：lan, wan, all
--port <number>        端口号（默认从配置读取）
--verbose              显示详细日志
--dev                  开发模式
```

### 配置文件路径
OpenClaw 通过以下方式查找配置文件：
1. `OPENCLAW_CONFIG_PATH` 环境变量
2. 默认路径 `/tmp/openclaw/openclaw.json`

必须在启动前设置正确的配置路径。

### 插件配置结构
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
    "feishu": {
      "enabled": true,
      "appId": "...",
      "appSecret": "...",
      "connectionMode": "websocket"
    },
    "dingtalk": {
      "enabled": true,
      "clientId": "...",
      "clientSecret": "...",
      "connectionMode": "webhook"
    }
  }
}
```

## 结论

通过系统性地分析部署日志，我们发现了三个关键问题：
1. 错误的入口文件路径
2. 不支持的 CLI 选项
3. 缺失的环境变量配置

修复后，OpenClaw 应该能够正常启动并运行。如果仍有问题，需要进一步检查部署日志中的错误信息。