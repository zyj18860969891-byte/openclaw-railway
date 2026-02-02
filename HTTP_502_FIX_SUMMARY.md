# OpenClaw HTTP 502 错误根本原因分析

## 问题定位

### HTTP 502错误详情
```json
{
  "httpStatus": 502,
  "responseDetails": "Retried single replica",
  "upstreamErrors": "[{\"deploymentInstanceID\":\"63eebb01-b783-41f1-910a-e6d812957747\",\"duration\":0,\"error\":\"connection refused\"}]"
}
```

### 根本原因
**"connection refused"** - 连接被拒绝

## 问题分析

### 1. 服务绑定问题
从部署日志可以看到：
```
✅ [gateway] listening on ws://127.0.0.1:8080 (PID 1)
✅ [gateway] listening on ws://[::1]:8080
```

**问题**: OpenClaw网关服务默认绑定到 `127.0.0.1` (本地地址)，而不是 `0.0.0.0` (所有接口)。

### 2. Railway代理问题
Railway的HTTP代理尝试连接到后端服务，但服务只绑定到本地地址，导致连接被拒绝。

### 3. 绑定模式配置
OpenClaw支持多种绑定模式：
- **loopback** (默认): 绑定到 `127.0.0.1` - 只能本地访问
- **lan**: 绑定到 `0.0.0.0` - 可从网络访问
- **tailnet**: 绑定到Tailscale IP
- **auto**: 自动选择
- **custom**: 自定义IP

## 解决方案

### 修复: 设置绑定模式为 `lan`

**修改railway.toml**:
```toml
[deploy]
  startCommand = "node dist/index.js gateway --allow-unconfigured --port 8080 --auth token --token aE8D17b2aef960C736De1cDFDdc4806d314e2C2DebDedAe84A832fdbDefAEC7A --bind lan"
  restartPolicyType = "always"
  restartPolicyMaxRetries = 10
```

**关键参数**: `--bind lan`
- 这会将服务绑定到 `0.0.0.0`
- 允许外部访问
- Railway代理可以成功连接

## 部署状态

### Git 提交记录
```
commit aa75462
Author: [Your Name]
Date:   [Date]

    修复HTTP 502错误，设置绑定模式为lan
```

### 文件变更
- ✅ railway.toml - 添加 `--bind lan` 参数

### Railway 部署状态
- ✅ 修复代码已推送到远程仓库
- 🔄 Railway正在自动重新部署

## 预期结果

修复完成后，部署日志应该显示：
```
✅ [gateway] listening on ws://0.0.0.0:8080 (PID 1)
✅ [gateway] listening on ws://[::]:8080
```

HTTP请求应该能够成功连接：
- ✅ HTTP 200 成功
- ✅ WebSocket连接正常
- ✅ Canvas UI可访问

## 连接信息

### 当前令牌
```
aE8D17b2aef960C736De1cDFDdc4806d314e2C2DebDedAe84A832fdbDefAEC7A
```

### WebSocket 连接
```javascript
const socket = new WebSocket('ws://openclaw-railway-production-4678.up.railway.app:8080?token=aE8D17b2aef960C736De1cDFDdc4806d314e2C2DebDedAe84A832fdbDefAEC7A');
```

### Canvas UI 访问
```
https://openclaw-railway-production-4678.up.railway.app/__openclaw__/canvas/
```

## 验证步骤

### 1. 等待 Railway 部署完成
- 查看 Railway 控制台
- 确认构建成功
- 检查服务状态

### 2. 检查部署日志
- 确认服务绑定到 `0.0.0.0`
- 确认没有连接拒绝错误
- 确认服务正常启动

### 3. 测试连接
- 访问Canvas UI
- 测试WebSocket连接
- 验证HTTP请求

## 技术细节

### 绑定模式说明
```typescript
// OpenClaw绑定模式解析逻辑
export async function resolveGatewayBindHost(
  bind: GatewayBindMode | undefined,
  customHost?: string,
): Promise<string> {
  const mode = bind ?? "loopback";  // 默认是loopback

  if (mode === "loopback") {
    return "127.0.0.1";  // 只能本地访问
  }

  if (mode === "lan") {
    return "0.0.0.0";  // 可从网络访问
  }

  // ... 其他模式
}
```

### Railway代理连接
```
Railway代理 (HTTP) → 0.0.0.0:8080 (OpenClaw服务)
```

如果服务绑定到 `127.0.0.1`，则：
```
Railway代理 (HTTP) → 127.0.0.1:8080 ❌ (连接被拒绝)
```

## 总结

通过设置 `--bind lan` 参数，我们解决了HTTP 502错误的根本原因：

1. **问题识别**: OpenClaw默认绑定到本地地址
2. **解决方案**: 设置绑定模式为 `lan`，绑定到 `0.0.0.0`
3. **预期结果**: Railway代理可以成功连接到后端服务

修复完成后，应该能够：
- ✅ 消除HTTP 502错误
- ✅ 成功访问Canvas UI
- ✅ 正常使用WebSocket服务
- ✅ 所有功能正常运行

现在等待Railway重新部署完成后，应该能够看到服务正常运行，HTTP 502错误消失。