# 小米 MiMo 模型完整配置指南

## 概述
本指南详细说明如何将 OpenClaw 系统切换到小米 MiMo V2 Flash 模型，包括所有必要的环境变量配置和内部文件修改。

## 前置条件
- ✅ Railway CLI 已安装并登录
- ✅ 项目已部署在 Railway
- ✅ 已获取小米/OpenRouter API 密钥

## 完整配置步骤

### 步骤 1: 设置环境变量

#### 1.1 设置 API 密钥
```bash
# 设置 OpenRouter API 密钥（小米模型通过 OpenRouter 提供）
railway variables --set "OPENROUTER_API_KEY=sk-or-v1-你的密钥"
```

#### 1.2 设置模型配置
```bash
# 方法 A: 使用通用 MODEL_NAME（推荐）
railway variables --set "MODEL_NAME=openrouter/xiaomi/mimo-v2-flash"

# 方法 B: 使用特定于 OpenRouter 的变量（向后兼容）
railway variables --set "MODEL_ID=openrouter/xiaomi/mimo-v2-flash"
```

#### 1.3 验证环境变量设置
```bash
# 检查变量是否设置成功
railway variables | Select-String "OPENROUTER_API_KEY\|MODEL_NAME\|MODEL_ID"
```

### 步骤 2: 配置文件自动生成

系统会在部署时自动生成配置文件，无需手动修改：

#### 2.1 配置文件位置
- **临时配置文件**: `/tmp/openclaw/openclaw.json`
- **生成脚本**: `ensure-config.sh`

#### 2.2 配置文件内容示例
```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "openrouter/xiaomi/mimo-v2-flash"
      }
    }
  },
  "models": {
    "providers": {
      "openrouter": {
        "baseUrl": "https://openrouter.ai/api/v1",
        "api": "openai-completions",
        "models": [
          {
            "id": "xiaomi/mimo-v2-flash",
            "name": "Xiaomi MiMo V2 Flash",
            "reasoning": false,
            "input": ["text"],
            "cost": {
              "input": 0,
              "output": 0,
              "cacheRead": 0,
              "cacheWrite": 0
            },
            "contextWindow": 262144,
            "maxTokens": 8192
          }
        ]
      }
    }
  }
}
```

### 步骤 3: 核心代码文件说明

以下文件在技能中已预先配置，无需额外修改：

#### 3.1 `src/agents/models-config.providers.ts`
- **函数**: `buildOpenRouterProvider(modelId?: string)`
- **作用**: 根据传入的 modelId 动态构建 OpenRouter provider 配置
- **小米模型处理**: 自动识别 `xiaomi/mimo-v2-flash` 并设置正确的上下文窗口 (262144) 和最大输出 (8192)

```typescript
// 小米模型识别逻辑
const isXiaomiModel = actualModelId.includes("xiaomi/mimo-v2-flash");
if (isXiaomiModel) {
  name = "Xiaomi MiMo V2 Flash";
  contextWindow = 262144;  // 小米模型的特殊上下文窗口
  maxTokens = 8192;
}
```

#### 3.2 `src/agents/pi-embedded-runner/run.ts`
- **作用**: 运行时解析 provider 和 model ID
- **解析逻辑**: 从 `MODEL_NAME` 环境变量中提取 provider 和 model

```typescript
let provider = (params.provider ?? DEFAULT_PROVIDER).trim() || DEFAULT_PROVIDER;
let modelId = (params.model ?? DEFAULT_MODEL).trim() || DEFAULT_MODEL;

// 只有当 provider 是默认值时才从 modelId 中提取 provider 前缀
if (provider === DEFAULT_PROVIDER) {
  const slashIndex = modelId.indexOf('/');
  if (slashIndex > 0) {
    const extractedProvider = modelId.slice(0, slashIndex);
    modelId = modelId.slice(slashIndex + 1);
    provider = extractedProvider;  // 提取出的 provider 覆盖传入的 provider
  }
}
```

#### 3.3 `ensure-config.sh`
- **作用**: 启动时生成 OpenClaw 配置文件
- **小米模型配置**: 读取 `MODEL_NAME` 环境变量并写入配置

```bash
#!/bin/bash
# 读取环境变量
MODEL_NAME="${MODEL_NAME:-openrouter/xiaomi/mimo-v2-flash}"

# 生成配置文件
cat > /tmp/openclaw/openclaw.json <<EOF
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "$MODEL_NAME"
      }
    }
  }
}
EOF
```

### 步骤 4: 部署和验证

#### 4.1 触发重新部署
```bash
# 标准部署
railway up

# 或强制重新构建（确保环境变量生效）
FORCE_REBUILD=1 railway up
```

#### 4.2 验证部署成功
```bash
# 查看部署日志
railway logs --follow

# 查找确认信息，应该看到类似：
# "agent model: openrouter/xiaomi/mimo-v2-flash"
# 或 "Using provider: openrouter, model: xiaomi/mimo-v2-flash"
```

#### 4.3 运行验证脚本
```bash
# 在 Railway 容器内运行验证脚本
railway run "python /app/skills/openrouter-model-switcher/scripts/validate_model_switch.py"

# 或使用快速设置脚本测试
railway run "python /app/skills/openrouter-model-switcher/scripts/quick_setup.py --test"
```

### 步骤 5: 故障排除

#### 5.1 常见问题

**问题 1: "Unknown model" 错误**
- **原因**: 模型 ID 格式错误或 provider 未识别
- **解决**: 确保使用完整格式 `openrouter/xiaomi/mimo-v2-flash`

**问题 2: API 调用失败**
- **原因**: OPENROUTER_API_KEY 未设置或无效
- **解决**: 
  ```bash
  railway variables --set "OPENROUTER_API_KEY=sk-or-v1-..."
  ```

**问题 3: 模型切换不生效**
- **原因**: 环境变量缓存或配置未更新
- **解决**:
  ```bash
  # 强制重新部署
  FORCE_REBUILD=1 railway up
  
  # 清理 Railway 缓存
  railway cache --clean
  ```

#### 5.2 调试命令
```bash
# 查看当前所有环境变量
railway variables

# 查看容器内实际运行的配置
railway run "cat /tmp/openclaw/openclaw.json"

# 查看应用日志
railway logs --tail 100

# 进入容器调试
railway run -- bash
# 在容器内：
# cat /tmp/openclaw/openclaw.json
# env | grep -E "OPENROUTER|MODEL"
```

### 步骤 6: 使用验证工具

#### 6.1 本地验证（无需部署）
```bash
cd skills/openrouter-model-switcher
python scripts/validate_model_switch.py --model openrouter/xiaomi/mimo-v2-flash
```

#### 6.2 交互式设置
```bash
python scripts/quick_setup.py
# 按照菜单选择：
# 1. 选择 OpenRouter 提供商
# 2. 选择 Xiaomi MiMo V2 Flash 模型
# 3. 可选自动部署
```

## 文件修改总结

### 需要修改的文件：
1. **无** - 所有代码文件已预先配置支持小米模型

### 需要设置的环境变量：
1. `OPENROUTER_API_KEY` - OpenRouter API 密钥（必需）
2. `MODEL_NAME` - 设置为 `openrouter/xiaomi/mimo-v2-flash`（必需）
3. `MODEL_ID` - 可选，与 MODEL_NAME 保持一致（向后兼容）

### 自动生成的文件：
1. `/tmp/openclaw/openclaw.json` - 由 `ensure-config.sh` 根据环境变量生成

## 验证检查清单

- [ ] OPENROUTER_API_KEY 已设置且有效
- [ ] MODEL_NAME 设置为 `openrouter/xiaomi/mimo-v2-flash`
- [ ] 重新部署完成（railway up）
- [ ] 日志中显示 "agent model: openrouter/xiaomi/mimo-v2-flash"
- [ ] 验证脚本通过所有检查
- [ ] 应用能够正常响应，使用小米模型

## 技术细节

### 小米模型特性
- **上下文窗口**: 262,144 tokens（比标准 128k 更大）
- **最大输出**: 8,192 tokens
- **API 类型**: OpenAI 兼容
- **提供商**: OpenRouter.ai
- **模型 ID**: `xiaomi/mimo-v2-flash`

### 配置优先级
1. `MODEL_NAME` 环境变量（最高优先级）
2. `MODEL_ID` 环境变量（向后兼容）
3. 默认值 `openrouter/stepfun/step-3.5-flash:free`

### 模型参数来源
- 硬编码识别：`buildOpenRouterProvider()` 中的 `isXiaomiModel` 判断
- 默认参数：`OPENROUTER_DEFAULT_*` 常量
- 动态解析：`run.ts` 中的 provider/model 分离逻辑

## 快速命令参考

```bash
# 1. 设置环境变量
railway variables --set "OPENROUTER_API_KEY=sk-or-v1-..."
railway variables --set "MODEL_NAME=openrouter/xiaomi/mimo-v2-flash"

# 2. 重新部署
FORCE_REBUILD=1 railway up

# 3. 验证
railway logs --follow | Select-String "agent model"
railway run "python /app/skills/openrouter-model-switcher/scripts/validate_model_switch.py"

# 4. 测试应用功能
# 发送测试消息，确认使用小米模型响应
```

## 相关资源

- **技能文档**: `skills/openrouter-model-switcher/SKILL.md`
- **验证脚本**: `skills/openrouter-model-switcher/scripts/validate_model_switch.py`
- **快速设置**: `skills/openrouter-model-switcher/scripts/quick_setup.py`
- **核心代码**: `src/agents/models-config.providers.ts`
- **运行时**: `src/agents/pi-embedded-runner/run.ts`

---

**注意**: 本指南基于已扩展的多提供商技能版本。如果使用原始版本，请确保已应用所有扩展修改。