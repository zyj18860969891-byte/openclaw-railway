# 从 StepFun 切换到小米 MiMo 模型完整指南

## 当前状态
- **当前模型**: StepFun Step 3.5 Flash (Free)
- **当前配置**: `openrouter/stepfun/step-3.5-flash:free`
- **API 提供商**: OpenRouter.ai

## 目标状态
- **目标模型**: Xiaomi MiMo V2 Flash
- **目标配置**: `openrouter/xiaomi/mimo-v2-flash`
- **API 提供商**: OpenRouter.ai (相同)

## 切换优势
- **更大上下文窗口**: 262,144 tokens vs 128,000 tokens
- **更高性能**: 小米模型在中文和代码任务上表现优秀
- **相同 API 接口**: 无需修改代码，仅需环境变量

## 完整切换步骤

### 步骤 1: 确认当前配置

```bash
# 查看当前环境变量
railway variables | Select-String "MODEL_NAME\|MODEL_ID\|OPENROUTER_API_KEY"

# 预期输出类似：
# MODEL_NAME=openrouter/stepfun/step-3.5-flash:free
# MODEL_ID=openrouter/stepfun/step-3.5-flash:free
# OPENROUTER_API_KEY=sk-or-v1-...
```

### 步骤 2: 设置小米模型环境变量

```bash
# 方法 1: 仅更新 MODEL_NAME（推荐，简洁）
railway variables --set "MODEL_NAME=openrouter/xiaomi/mimo-v2-flash"

# 方法 2: 同时更新 MODEL_NAME 和 MODEL_ID（确保兼容性）
railway variables --set "MODEL_NAME=openrouter/xiaomi/mimo-v2-flash"
railway variables --set "MODEL_ID=openrouter/xiaomi/mimo-v2-flash"

# 验证设置成功
railway variables | Select-String "MODEL_NAME\|MODEL_ID"
# 应显示：MODEL_NAME=openrouter/xiaomi/mimo-v2-flash
```

**重要**: 不需要修改 `OPENROUTER_API_KEY`，因为小米模型同样通过 OpenRouter 提供。

### 步骤 3: 触发重新部署

```bash
# 标准部署（会检测到环境变量变化并重新构建）
railway up

# 或强制重新构建（确保环境变量立即生效）
FORCE_REBUILD=1 railway up

# 等待部署完成，观察日志输出
```

### 步骤 4: 验证切换成功

#### 4.1 查看部署日志
```bash
railway logs --follow

# 查找关键信息：
# ✅ "agent model: openrouter/xiaomi/mimo-v2-flash"
# ✅ "Using provider: openrouter, model: xiaomi/mimo-v2-flash"
# ✅ "Model configuration loaded: xiaomi/mimo-v2-flash"
```

#### 4.2 运行验证脚本
```bash
# 在 Railway 容器内运行验证
railway run "python /app/skills/openrouter-model-switcher/scripts/validate_model_switch.py"

# 预期输出：
# ✅ OPENROUTER_API_KEY is set
# ✅ MODEL_NAME format valid: openrouter/xiaomi/mimo-v2-flash
# ✅ All checks passed!
```

#### 4.3 检查实际配置文件
```bash
# 查看容器内生成的配置文件
railway run "cat /tmp/openclaw/openclaw.json"

# 确认包含：
# "primary": "openrouter/xiaomi/mimo-v2-flash"
```

#### 4.4 测试应用功能
```bash
# 发送测试请求，确认模型正常工作
# 可以使用 curl 或应用的前端界面测试
# 响应应来自小米 MiMo 模型
```

### 步骤 5: 故障排除

#### 问题 1: 模型未切换，仍使用 StepFun
**原因**: 环境变量未正确设置或缓存
**解决**:
```bash
# 1. 确认环境变量设置正确
railway variables | Select-String "MODEL_NAME"

# 2. 强制重新部署
FORCE_REBUILD=1 railway up

# 3. 清理 Railway 缓存
railway cache --clean
railway up
```

#### 问题 2: "Unknown model" 错误
**原因**: 模型 ID 格式错误
**解决**:
```bash
# 确保使用完整格式
railway variables --set "MODEL_NAME=openrouter/xiaomi/mimo-v2-flash"
# 而不是：xiaomi/mimo-v2-flash（缺少 openrouter/ 前缀）
```

#### 问题 3: API 调用失败
**原因**: OpenRouter API 密钥问题
**解决**:
```bash
# 1. 验证 API 密钥有效
railway variables --set "OPENROUTER_API_KEY=sk-or-v1-你的有效密钥"

# 2. 检查 OpenRouter 账户余额和权限
# 访问 https://openrouter.ai/account

# 3. 确认小米模型在 OpenRouter 上可用
```

#### 问题 4: 上下文窗口错误
**原因**: 代码版本过旧，未包含小米模型的特殊参数
**解决**:
```bash
# 确保代码是最新的，包含小米模型的特殊配置
# 检查 src/agents/models-config.providers.ts 中的 buildOpenRouterProvider 函数
# 应包含小米模型的上下文窗口设置：262144
```

### 步骤 6: 性能优化建议

切换成功后，可以调整以下参数以充分利用小米模型的能力：

#### 6.1 调整上下文窗口
小米模型支持 262,144 tokens 上下文，可以在配置中调整：
```bash
# 如果需要更大的上下文，可以设置（通常不需要）
railway variables --set "CONTEXT_TOKENS=200000"
```

#### 6.2 监控使用情况
```bash
# 查看 API 使用统计
railway logs --tail 100 | Select-String "tokens\|usage\|cost"

# 小米模型在 OpenRouter 上的定价可能不同
# 查看：https://openrouter.ai/models/xiaomi/mimo-v2-flash
```

## 文件修改对照表

| 文件 | 是否需要修改 | 修改内容 | 说明 |
|------|------------|---------|------|
| `ensure-config.sh` | ❌ 否 | 自动读取 `MODEL_NAME` | 无需修改 |
| `src/agents/models-config.providers.ts` | ❌ 否 | 已内置小米模型支持 | 无需修改 |
| `src/agents/pi-embedded-runner/run.ts` | ❌ 否 | 自动解析 provider/model | 无需修改 |
| Railway 环境变量 | ✅ 是 | `MODEL_NAME` 改为 `openrouter/xiaomi/mimo-v2-flash` | 必需 |

## 配置对比

### StepFun 模型配置
```bash
MODEL_NAME=openrouter/stepfun/step-3.5-flash:free
# 上下文窗口: 128,000 tokens
# 最大输出: 8,192 tokens
```

### 小米 MiMo 配置
```bash
MODEL_NAME=openrouter/xiaomi/mimo-v2-flash
# 上下文窗口: 262,144 tokens (更大)
# 最大输出: 8,192 tokens
```

## 验证检查清单

- [ ] 环境变量 `MODEL_NAME` 已更新为 `openrouter/xiaomi/mimo-v2-flash`
- [ ] 重新部署完成（`railway up` 成功）
- [ ] 日志中显示小米模型信息
- [ ] 验证脚本通过所有检查
- [ ] 应用能够正常响应
- [ ] 长上下文任务测试正常（可选）

## 快速命令参考

```bash
# 1. 切换模型
railway variables --set "MODEL_NAME=openrouter/xiaomi/mimo-v2-flash"

# 2. 重新部署
FORCE_REBUILD=1 railway up

# 3. 验证
railway logs --follow | Select-String "xiaomi\|mimo"
railway run "python /app/skills/openrouter-model-switcher/scripts/validate_model_switch.py"

# 4. 查看配置
railway run "cat /tmp/openclaw/openclaw.json"
```

## 回滚到 StepFun（如需）

如果需要恢复到 StepFun 模型：

```bash
railway variables --set "MODEL_NAME=openrouter/stepfun/step-3.5-flash:free"
FORCE_REBUILD=1 railway up
```

## 技术细节

### 模型识别机制
在 `buildOpenRouterProvider()` 函数中：
```typescript
const isXiaomiModel = actualModelId.includes("xiaomi/mimo-v2-flash");
if (isXiaomiModel) {
  name = "Xiaomi MiMo V2 Flash";
  contextWindow = 262144;  // 小米特殊参数
  maxTokens = 8192;
}
```

### 配置生成流程
1. `ensure-config.sh` 启动时执行
2. 读取 `MODEL_NAME` 环境变量
3. 生成 `/tmp/openclaw/openclaw.json`
4. OpenClaw 启动时加载配置
5. `resolveImplicitProviders()` 创建 provider 配置
6. `buildOpenRouterProvider()` 根据 modelId 构建模型定义

### 模型参数优先级
1. 硬编码识别（小米、StepFun、Llama）
2. 默认参数（`OPENROUTER_DEFAULT_*`）
3. 环境变量覆盖

## 相关文档

- **通用技能文档**: `skills/openrouter-model-switcher/SKILL.md`
- **小米配置指南**: `skills/openrouter-model-switcher/XIAOMI_MODEL_SETUP_GUIDE.md`
- **验证工具**: `skills/openrouter-model-switcher/scripts/validate_model_switch.py`
- **快速设置**: `skills/openrouter-model-switcher/scripts/quick_setup.py`

---

**完成切换后，您的应用将使用小米 MiMo V2 Flash 模型，享受更大的上下文窗口和优秀的中文处理能力！**