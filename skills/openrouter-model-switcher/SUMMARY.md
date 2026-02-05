# OpenRouter Model Switcher Skill - 完整总结

## 🎯 技能概述

这个技能封装了通过环境变量动态切换 OpenRouter AI 模型的完整解决方案，包括：

- ✅ **完整的技能结构**：符合 OpenClaw skill-creator 规范
- ✅ **验证工具**：`validate_model_switch.py` - 检查配置正确性
- ✅ **快速设置**：`quick_setup.py` - 交互式设置向导
- ✅ **详细文档**：SKILL.md, README.md, QUICK_REFERENCE.md
- ✅ **测试套件**：`test_skill.py` - 验证技能功能

## 📁 文件结构

```
skills/openrouter-model-switcher/
├── SKILL.md                    # 技能主文档（必需）
├── README.md                   # 详细使用指南
├── QUICK_REFERENCE.md         # 快速参考卡片
├── test_skill.py              # 技能测试脚本
├── scripts/
│   ├── __init__.py            # Python 包初始化
│   ├── validate_model_switch.py   # 配置验证工具
│   └── quick_setup.py         # 快速设置向导
└── references/                # (可选) 参考资料目录
```

## 🔄 使用流程

### 1. 前置检查

```bash
# 确保 OPENROUTER_API_KEY 已设置
railway variables --set "OPENROUTER_API_KEY=sk-or-v1-..."

# 验证当前配置
python skills/openrouter-model-switcher/scripts/validate_model_switch.py
```

### 2. 切换模型

```bash
# 设置新模型（必须包含 openrouter/ 前缀）
railway variables --set "MODEL_NAME=openrouter/xiaomi/mimo-v2-flash"
railway variables --set "MODEL_ID=openrouter/xiaomi/mimo-v2-flash"

# 重新部署
railway up
```

### 3. 验证结果

```bash
# 查看日志
railway logs --follow | Select-String "agent model"

# 应该看到：agent model: openrouter/xiaomi/mimo-v2-flash
```

## ⚠️ 之前遇到的问题及解决方案

### 问题 1：模型ID格式错误

**现象**：
```
Error: Unknown model: xiaomi/mimo-v2-flash
```

**原因**：
- 使用了 `xiaomi/mimo-v2-flash` 而不是 `openrouter/xiaomi/mimo-v2-flash`
- 缺少 `openrouter/` 前缀

**解决方案**：
1. 环境变量必须包含完整格式：`openrouter/提供商/模型ID`
2. 修改 `ensure-config.sh` 正确处理环境变量
3. 验证时检查格式规范

### 问题 2：buildOpenRouterProvider 函数不兼容

**现象**：
即使使用正确格式 `openrouter/xiaomi/mimo-v2-flash`，模型仍无法识别

**原因**：
- `buildOpenRouterProvider` 存储的模型ID包含 `openrouter/` 前缀
- 但 `resolveModel` 查找时使用实际ID（不带前缀）
- 导致 provider=`openrouter`, modelId=`xiaomi/mimo-v2-flash` 找不到匹配

**解决方案**：
修改 `buildOpenRouterProvider` 函数：
```typescript
function buildOpenRouterProvider(modelId?: string): ProviderConfig {
  let fullModelId = modelId ?? OPENROUTER_DEFAULT_MODEL_ID;
  let actualModelId = fullModelId;
  
  // 去掉 openrouter/ 前缀
  if (actualModelId.startsWith("openrouter/")) {
    actualModelId = actualModelId.slice("openrouter/".length);
  }

  // 使用 actualModelId 进行模型识别和存储
  return {
    models: [{
      id: actualModelId, // ✅ 存储：xiaomi/mimo-v2-flash
      // ...
    }]
  };
}
```

### 问题 3：run.ts 中的二次解析覆盖

**现象**：
- 正确设置 `MODEL_NAME=openrouter/xiaomi/mimo-v2-flash`
- 但运行时 provider 被错误覆盖为 `xiaomi`

**原因**：
```typescript
// 原始问题代码
let provider = "openrouter";  // 来自调用者
let modelId = "openrouter/xiaomi/mimo-v2-flash";

const slashIndex = modelId.indexOf('/');
if (slashIndex > 0) {
  const extractedProvider = modelId.slice(0, slashIndex); // "openrouter"
  modelId = modelId.slice(slashIndex + 1); // "xiaomi/mimo-v2-flash"
  provider = extractedProvider; // provider 仍然是 "openrouter" ✅
}

// 但后续代码再次解析...
// 导致 provider 变成 "xiaomi" ❌
```

**解决方案**：
修改解析逻辑，只在 provider 为默认值时才提取：
```typescript
let provider = (params.provider ?? DEFAULT_PROVIDER).trim() || DEFAULT_PROVIDER;
let modelId = (params.model ?? DEFAULT_MODEL).trim() || DEFAULT_MODEL;

// ✅ 只在 provider 是默认值时才从 modelId 中提取
if (provider === DEFAULT_PROVIDER) {
  const slashIndex = modelId.indexOf('/');
  if (slashIndex > 0) {
    const extractedProvider = modelId.slice(0, slashIndex);
    modelId = modelId.slice(slashIndex + 1);
    provider = extractedProvider;
  }
}
```

## 🔧 核心代码修改总结

### 1. ensure-config.sh
```bash
# 从环境变量读取模型名称
MODEL_NAME=${MODEL_NAME:-"xiaomi/mimo-v2-flash"}
echo "使用模型: $MODEL_NAME"

# 在配置文件中直接使用环境变量的值
cat <<EOF > "$CONFIG_PATH"
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

### 2. src/agents/models-config.providers.ts
```typescript
function buildOpenRouterProvider(modelId?: string): ProviderConfig {
  // 处理 openrouter/ 前缀
  let fullModelId = modelId ?? OPENROUTER_DEFAULT_MODEL_ID;
  let actualModelId = fullModelId;
  
  if (actualModelId.startsWith("openrouter/")) {
    actualModelId = actualModelId.slice("openrouter/".length);
  }

  // 根据实际模型ID判断类型
  const isXiaomiModel = actualModelId.includes("xiaomi/mimo-v2-flash");
  const isStepModel = actualModelId.includes("stepfun/step-3.5-flash:free");
  const isLlamaModel = actualModelId.includes("meta-llama/llama-3.3-70b:free");

  let name = "OpenRouter Model";
  let contextWindow = OPENROUTER_DEFAULT_CONTEXT_WINDOW;
  let maxTokens = OPENROUTER_DEFAULT_MAX_TOKENS;

  if (isXiaomiModel) {
    name = "Xiaomi MiMo V2 Flash";
    contextWindow = 262144;
    maxTokens = 8192;
  } else if (isStepModel) {
    name = "StepFun Step 3.5 Flash (Free)";
    contextWindow = 128000;
    maxTokens = 8192;
  } else if (isLlamaModel) {
    name = "Meta Llama 3.3 70B (Free)";
    contextWindow = 128000;
    maxTokens = 8192;
  }

  return {
    baseUrl: OPENROUTER_BASE_URL,
    api: "openai-completions",
    models: [{
      id: actualModelId, // 存储不带前缀的ID
      name,
      reasoning: false,
      input: ["text"],
      cost: OPENROUTER_DEFAULT_COST,
      contextWindow,
      maxTokens,
    }],
  };
}
```

### 3. src/agents/pi-embedded-runner/run.ts
```typescript
let provider = (params.provider ?? DEFAULT_PROVIDER).trim() || DEFAULT_PROVIDER;
let modelId = (params.model ?? DEFAULT_MODEL).trim() || DEFAULT_MODEL;

// ✅ 只在 provider 是默认值时才从 modelId 中提取前缀
if (provider === DEFAULT_PROVIDER) {
  const slashIndex = modelId.indexOf('/');
  if (slashIndex > 0) {
    const extractedProvider = modelId.slice(0, slashIndex);
    modelId = modelId.slice(slashIndex + 1);
    provider = extractedProvider;
  }
}
```

## 📋 模型切换检查清单

### 切换前
- [ ] `OPENROUTER_API_KEY` 已设置
- [ ] 目标模型ID格式正确（包含 `openrouter/` 前缀）
- [ ] 运行验证脚本：`python validate_model_switch.py`

### 设置环境变量
- [ ] `MODEL_NAME=openrouter/提供商/模型ID`
- [ ] `MODEL_ID=openrouter/提供商/模型ID`
- [ ] 两个变量值保持一致

### 部署后验证
- [ ] 构建成功，无错误
- [ ] 容器启动成功
- [ ] 日志显示 `agent model: openrouter/...`
- [ ] 无 "Unknown model" 错误
- [ ] 模型能正常响应请求

## 🎯 支持的模型格式

| 提供商 | 模型 | 完整格式 |
|--------|------|----------|
| Xiaomi | MiMo V2 Flash | `openrouter/xiaomi/mimo-v2-flash` |
| StepFun | Step 3.5 Flash (Free) | `openrouter/stepfun/step-3.5-flash:free` |
| Meta | Llama 3.3 70B (Free) | `openrouter/meta-llama/llama-3.3-70b:free` |

**通用格式**：`openrouter/提供商/模型ID`

## 🚀 快速命令参考

```bash
# 1. 设置模型
railway variables --set "MODEL_NAME=openrouter/xiaomi/mimo-v2-flash"
railway variables --set "MODEL_ID=openrouter/xiaomi/mimo-v2-flash"

# 2. 部署
railway up

# 3. 验证
railway logs --follow | Select-String "agent model"

# 4. 使用验证工具
railway run "python /app/skills/openrouter-model-switcher/scripts/validate_model_switch.py"
```

## 📚 技能文件说明

### SKILL.md
- 技能的主文档，包含完整的使用指南
- 符合 skill-creator 规范
- 包含元数据、概述、工作流程、故障排除等

### README.md
- 详细的用户指南
- 包含技术细节、工作原理、常见问题
- 适合深入阅读和理解

### QUICK_REFERENCE.md
- 快速参考卡片
- 常用命令、模型格式、故障排除表
- 适合快速查阅

### scripts/validate_model_switch.py
- 配置验证工具
- 检查环境变量、配置文件、模型格式
- 提供详细的诊断信息

### scripts/quick_setup.py
- 交互式设置向导
- 自动检查 Railway CLI、项目配置
- 提供模型选择菜单
- 可选自动部署

### test_skill.py
- 技能自测试脚本
- 验证文件结构、脚本功能、格式验证
- 确保技能完整可用

## ✅ 验证结果

所有测试通过：
- ✅ 技能目录结构完整
- ✅ 所有必需文件存在
- ✅ SKILL.md 元数据正确
- ✅ 验证脚本功能正常
- ✅ 快速设置脚本结构正确
- ✅ 模型格式验证准确

## 🎉 总结

这个技能现在完全可用，提供了：

1. **完整的解决方案**：从配置到部署的完整流程
2. **验证工具**：确保每次切换都正确配置
3. **故障排除**：详细的错误诊断和解决方案
4. **易于使用**：交互式向导和快速参考
5. **可扩展**：轻松添加对新 OpenRouter 模型的支持

用户可以安全地通过环境变量切换任何 OpenRouter 模型，无需担心格式问题或配置错误。
