# Universal Model Switcher Skill

一个用于动态切换多个 AI 模型提供商的技能，通过环境变量实现无需代码修改的模型更换。

## 功能特性

- 🔄 **动态切换**：通过环境变量实时切换不同 AI 模型
- 🚀 **零代码修改**：无需改动代码，只需更新环境变量并重新部署
- 🌐 **多提供商支持**：支持 OpenRouter、Anthropic、OpenAI、DeepSeek 等主流提供商
- 📦 **即插即用**：完整的技能包，包含验证和快速设置脚本
- 🛠️ **故障排除**：内置验证工具和详细的问题诊断指南

## 支持的提供商和模型

### OpenRouter 平台模型
| 提供商 | 模型名称 | 模型ID格式 |
|--------|----------|------------|
| 小米 | MiMo V2 Flash | `openrouter/xiaomi/mimo-v2-flash` |
| StepFun | Step 3.5 Flash (Free) | `openrouter/stepfun/step-3.5-flash:free` |
| Meta | Llama 3.3 70B (Free) | `openrouter/meta-llama/llama-3.3-70b:free` |

### 直接提供商模型
| 提供商 | 示例模型 | 模型ID格式 |
|--------|----------|------------|
| Anthropic | Claude Sonnet 4.5, Claude Opus 4.5 | `anthropic/claude-sonnet-4-5` |
| OpenAI | GPT-4 Turbo, GPT-3.5 Turbo | `openai/gpt-4-turbo-preview` |
| DeepSeek | DeepSeek Chat | `deepseek/deepseek-chat` |
| Together AI | Llama 3.3 70B Instruct | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` |
| Perplexity | Sonar Large 128k | `perplexity/llama-3.1-sonar-large-128k-online` |

## 快速开始

### 1. 前置条件

根据您选择的提供商设置相应的 API 密钥：

```bash
# OpenRouter 模型
railway variables --set "OPENROUTER_API_KEY=your-api-key-here"

# 或 Anthropic Claude
railway variables --set "ANTHROPIC_API_KEY=your-api-key-here"

# 或 OpenAI GPT
railway variables --set "OPENAI_API_KEY=your-api-key-here"
```

### 2. 切换模型

**方法 A：使用通用 MODEL_NAME（推荐用于 OpenRouter）：**
```bash
railway variables --set "MODEL_NAME=openrouter/meta-llama/llama-3.3-70b:free"
railway up
```

**方法 B：使用提供商特定的 MODEL 变量：**
```bash
# Anthropic Claude
railway variables --set "ANTHROPIC_MODEL=claude-sonnet-4-5"
railway up

# OpenAI GPT-4
railway variables --set "OPENAI_MODEL=gpt-4-turbo-preview"
railway up
```

### 3. 验证切换

```bash
# 查看日志确认模型已加载
railway logs --follow | Select-String "agent model"

# 运行验证脚本
railway run "python /app/skills/openrouter-model-switcher/scripts/validate_model_switch.py"
```

## 使用验证脚本

```bash
# 检查当前配置
python scripts/validate_model_switch.py

# 测试特定模型格式
python scripts/validate_model_switch.py --model openrouter/xiaomi/mimo-v2-flash

# 测试连接性（需要容器内运行）
python scripts/validate_model_switch.py --test
```

## 快速设置向导

使用交互式设置脚本快速配置：

```bash
python scripts/quick_setup.py
```

该脚本会：
- ✅ 检查 Railway CLI 安装和登录状态
- ✅ 验证项目配置
- ✅ 显示当前模型设置
- ✅ 提供模型选择菜单
- ✅ 自动设置环境变量
- ✅ 可选自动部署

## 模型格式规范

**通用格式（所有提供商）：**
```
provider/model-id
```

**OpenRouter 模型**支持两种格式：
- `openrouter/provider/model-id`（带前缀）
- `provider/model-id`（不带前缀）

**示例：**
- ✅ `openrouter/xiaomi/mimo-v2-flash`
- ✅ `xiaomi/mimo-v2-flash`（OpenRouter 不带前缀）
- ✅ `anthropic/claude-sonnet-4-5`
- ✅ `openai/gpt-4-turbo-preview`
- ✅ `deepseek/deepseek-chat`

**常见错误：**
- ❌ `claude-sonnet-4-5` - 缺少提供商前缀
- ❌ `gpt-4` - 缺少提供商前缀
- ❌ `openrouter/` - 模型ID为空

## 故障排除

### 问题：Unknown model 错误

**原因**：模型ID格式不正确或提供商未识别

**解决**：
- 使用 `provider/model-id` 格式（如 `anthropic/claude-sonnet-4-5`）
- 检查提供商是否在支持列表中
- 验证模型ID在提供商平台是否存在

### 问题：模型切换不生效

**原因**：环境变量未正确设置或缓存

**解决**：
1. 验证：`railway variables | Select-String "MODEL_NAME"`
2. 强制重建：`FORCE_REBUILD=1 railway up`
3. 检查是否正确设置了对应提供商的 API 密钥

### 问题：API 调用失败

**原因**：API 密钥缺失、无效或提供商特定配置需求

**解决**：
- 确保设置了正确的提供商 API 密钥
- 验证 API 密钥有足够的权限和额度
- 检查提供商特定要求（如 base URL、headers 等）

## 技术细节

### 工作原理

1. **配置阶段**：`ensure-config.sh` 读取环境变量（`MODEL_NAME` 或提供商特定变量），生成 OpenClaw 配置文件
2. **Provider 解析**：`resolveImplicitProviders()` 根据环境变量和 API 密钥动态构建 provider 配置
3. **模型构建**：`buildOpenRouterProvider()` 或 `buildGenericOpenAIProvider()` 根据模型ID生成模型定义
4. **运行阶段**：`run.ts` 解析模型ID中的 provider 前缀，查找对应模型
5. **执行阶段**：使用解析出的 provider 和 model ID 进行 API 调用

### 关键文件

- `ensure-config.sh` - 配置文件生成脚本
- `src/agents/models-config.providers.ts` - Provider 配置和模型解析，包含：
  - `buildOpenRouterProvider()` - OpenRouter 模型构建
  - `buildGenericOpenAIProvider()` - 通用 OpenAI 兼容提供商构建
  - `resolveImplicitProviders()` - 动态 provider 解析
- `src/agents/pi-embedded-runner/run.ts` - 运行时模型解析逻辑

### 模型参数

对于未特别处理的模型，将使用默认参数：
- 上下文窗口：128000 tokens
- 最大输出：8192 tokens
- 模型名称：自动生成（基于模型ID）

如需特定模型的特殊参数，可以在 `buildOpenRouterProvider()` 或 `buildGenericOpenAIProvider()` 中添加自定义逻辑。

## 高级用法

### 添加自定义模型支持

在 `src/agents/models-config.providers.ts` 的 `buildOpenRouterProvider()` 函数中添加：

```typescript
const isMyModel = actualModelId.includes("provider/model-id");

if (isMyModel) {
  name = "My Custom Model";
  contextWindow = 200000; // 自定义上下文窗口
  maxTokens = 10000;      // 自定义最大输出
}
```

### 批量切换模型

创建脚本批量测试不同模型：

```bash
#!/bin/bash
models=(
  "openrouter/xiaomi/mimo-v2-flash"
  "openrouter/stepfun/step-3.5-flash:free"
  "openrouter/meta-llama/llama-3.3-70b:free"
)

for model in "${models[@]}"; do
  echo "Testing model: $model"
  railway variables --set "MODEL_NAME=$model"
  railway variables --set "MODEL_ID=$model"
  railway up
  sleep 60 # 等待部署完成
  railway logs --tail 50 | Select-String "agent model"
done
```

## 文件结构

```
skills/openrouter-model-switcher/
├── SKILL.md                    # 技能主文档
├── QUICK_REFERENCE.md          # 快速参考
├── README.md                   # 本文件
├── scripts/
│   ├── validate_model_switch.py   # 配置验证工具
│   └── quick_setup.py             # 快速设置向导
└── references/                 # (可选) 参考资料目录
```

## 最佳实践

1. **始终使用完整格式**：包括 `openrouter/` 前缀
2. **保持环境变量同步**：`MODEL_NAME` 和 `MODEL_ID` 应设置为相同值
3. **先验证后部署**：使用验证脚本检查配置
4. **监控部署日志**：关注 `agent model` 和错误信息
5. **测试模型响应**：部署后发送测试消息确认模型正常工作

## 参考资源

- [OpenRouter 模型目录](https://openrouter.ai/models)
- [Railway 环境变量文档](https://docs.railway.app/variables)
- [OpenClaw 配置指南](../docs/gateway/configuration.md)

## 许可证

MIT License - 详见 LICENSE 文件

---

**提示**：此技能封装了通过环境变量动态切换 OpenRouter 模型的完整解决方案，包括验证工具和故障排除指南，确保模型切换过程可靠且可重复。
