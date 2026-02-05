---
name: openrouter-model-switcher
description: Dynamically switch AI models from multiple providers via environment variables. Supports OpenRouter, Anthropic, OpenAI, DeepSeek, and other OpenAI-compatible APIs without code changes.
metadata: {"openclaw":{"emoji":"🔄","os":["linux","darwin","win32"],"requires":{"env":["OPENROUTER_API_KEY","MODEL_NAME","MODEL_ID"]},"install":[]}}
---

# Universal Model Switcher

## Overview

This skill enables dynamic switching between different AI models from multiple providers by simply changing environment variables and redeploying the application. No code changes required.

**Supported Providers:**
- **OpenRouter**: Any model from OpenRouter.ai platform
- **Anthropic**: Claude models (Claude Sonnet 4.5, Claude Opus 4.5, etc.)
- **OpenAI**: GPT-4, GPT-3.5 Turbo, etc.
- **DeepSeek**: DeepSeek Chat and other models
- **Together AI**: Various open models
- **Perplexity**: Perplexity AI models
- **Moonshot**: Kimi models
- **Kimi Code**: Kimi for Coding
- **MiniMax**: MiniMax models
- **Qwen Portal**: Alibaba Qwen models
- **Ollama**: Local models via Ollama
- **Xiaomi**: MiMo models
- **Venice**: Venice AI models
- **Synthetic**: Synthetic test models

**Flexible Model Format:**
- `provider/model-id` format (e.g., `anthropic/claude-sonnet-4-5`)
- OpenRouter models can use `openrouter/` prefix or direct format
- Provider-specific environment variables supported

## Quick Start

### 1. Prerequisites
- ✅ Set the appropriate API key for your chosen provider (see Environment Variables section)
- ✅ Application must be deployed on Railway with the updated code

### 2. Switch to a New Model

**Option A: Using generic MODEL_NAME (recommended for OpenRouter):**
```bash
# Set the model with provider prefix
railway variables --set "MODEL_NAME=openrouter/meta-llama/llama-3.3-70b:free"
railway variables --set "OPENROUTER_API_KEY=your-api-key"

# Redeploy the application
railway up
```

**Option B: Using provider-specific MODEL variables:**
```bash
# For Anthropic Claude
railway variables --set "ANTHROPIC_MODEL=claude-sonnet-4-5"
railway variables --set "ANTHROPIC_API_KEY=your-api-key"

# For OpenAI GPT-4
railway variables --set "OPENAI_MODEL=gpt-4-turbo-preview"
railway variables --set "OPENAI_API_KEY=your-api-key"

# Redeploy the application
railway up
```

### 3. Verify the Switch
```bash
# Check deployment logs
railway logs --follow

# Look for: "agent model: anthropic/claude-sonnet-4-5" or similar
```

## Model Format Rules

**General format for all providers:**
```
provider/model-id
```

**OpenRouter models** can use either format:
- `openrouter/provider/model-id` (with prefix)
- `provider/model-id` (without prefix)

**Examples:**
- ✅ `openrouter/xiaomi/mimo-v2-flash`
- ✅ `xiaomi/mimo-v2-flash` (OpenRouter without prefix)
- ✅ `anthropic/claude-sonnet-4-5`
- ✅ `openai/gpt-4-turbo-preview`
- ✅ `deepseek/deepseek-chat`
- ❌ `claude-sonnet-4-5` (missing provider prefix)
- ❌ `gpt-4` (missing provider prefix)

## Technical Details

### How It Works

1. **Environment Variables**: `MODEL_NAME` and `MODEL_ID` are read during container startup
2. **Config Generation**: `ensure-config.sh` creates `/tmp/openclaw/openclaw.json` with the specified model
3. **Provider Resolution**: `buildOpenRouterProvider()` processes the model ID and registers it with the `openrouter` provider
4. **Model Parsing**: `run.ts` extracts provider from model ID when it contains `/`
5. **Model Lookup**: The model is found in the provider's model list and used for API calls

### Key Files Modified

- `ensure-config.sh` - Reads `MODEL_NAME` and generates config
- `src/agents/models-config.providers.ts` - `buildOpenRouterProvider()` handles dynamic models
- `src/agents/pi-embedded-runner/run.ts` - Parses provider/model from model ID

### Environment Variables

**Required API Keys** (set at least one):
- `OPENROUTER_API_KEY` - For OpenRouter models
- `ANTHROPIC_API_KEY` - For Anthropic Claude models
- `OPENAI_API_KEY` - For OpenAI models
- `DEEPSEEK_API_KEY` - For DeepSeek models
- `TOGETHER_API_KEY` - For Together AI models
- `PERPLEXITY_API_KEY` - For Perplexity AI models

**Model Configuration:**
- `MODEL_NAME` - Generic model specification (e.g., `openrouter/meta-llama/llama-3.3-70b:free`)
- `MODEL_ID` - Alternative to MODEL_NAME (legacy)
- `ANTHROPIC_MODEL` - Anthropic-specific model (e.g., `claude-sonnet-4-5`)
- `OPENAI_MODEL` - OpenAI-specific model (e.g., `gpt-4-turbo-preview`)
- `DEEPSEEK_MODEL` - DeepSeek-specific model (e.g., `deepseek-chat`)
- `TOGETHER_MODEL` - Together AI-specific model
- `PERPLEXITY_MODEL` - Perplexity-specific model

### Common Issues & Solutions

#### Issue 1: "Unknown model" error
**Cause**: Model ID format is incorrect or provider not recognized
**Solution**: 
- Use `provider/model-id` format (e.g., `anthropic/claude-sonnet-4-5`)
- Check that the provider is in the supported list
- Verify the model ID exists with the provider

#### Issue 2: Model not switching after redeploy
**Cause**: Environment variables not properly set or cached
**Solution**: 
- Verify with `railway variables | Select-String "MODEL_NAME"`
- Force rebuild with `FORCE_REBUILD=1 railway up`
- Check that the correct provider API key is set

#### Issue 3: Model recognized but API calls fail
**Cause**: API key missing, invalid, or provider-specific configuration needed
**Solution**: 
- Ensure the correct API key for your provider is set
- Verify API key has proper permissions and credits
- Check provider-specific requirements (e.g., base URL, headers)

## Supported Models Reference

### OpenRouter Models
| Provider | Model | Format |
|---------|-------|--------|
| Xiaomi | MiMo V2 Flash | `openrouter/xiaomi/mimo-v2-flash` |
| StepFun | Step 3.5 Flash (Free) | `openrouter/stepfun/step-3.5-flash:free` |
| Meta | Llama 3.3 70B (Free) | `openrouter/meta-llama/llama-3.3-70b:free` |

### Direct Provider Models
| Provider | Example Models | Format |
|---------|---------------|--------|
| Anthropic | Claude Sonnet 4.5, Claude Opus 4.5 | `anthropic/claude-sonnet-4-5` |
| OpenAI | GPT-4 Turbo, GPT-3.5 Turbo | `openai/gpt-4-turbo-preview` |
| DeepSeek | DeepSeek Chat | `deepseek/deepseek-chat` |
| Together AI | Llama 3.3 70B Instruct | `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` |
| Perplexity | Sonar Large 128k | `perplexity/llama-3.1-sonar-large-128k-online` |

### Provider-Specific Environment Variables
For convenience, you can use provider-specific model variables:
- `ANTHROPIC_MODEL=claude-sonnet-4-5`
- `OPENAI_MODEL=gpt-4-turbo-preview`
- `DEEPSEEK_MODEL=deepseek-chat`
- `TOGETHER_MODEL=meta-llama/Llama-3.3-70B-Instruct-Turbo`
- `PERPLEXITY_MODEL=llama-3.1-sonar-large-128k-online`

*Note: Check each provider's documentation for the latest available models and their exact IDs.*

## Troubleshooting

### Check Current Configuration
```bash
# View all environment variables
railway variables

# Check model settings
railway variables | Select-String "MODEL"
```

### Verify Model Registration
```bash
# Access container shell
railway run "bash"

# Check generated config
cat /tmp/openclaw/openclaw.json

# Check if models.json was created (if applicable)
ls -la /tmp/openclaw/models.json 2>/dev/null || echo "models.json not found"
```

### View Detailed Logs
```bash
# Follow application logs
railway logs --follow

# Look for these key messages:
# - "使用模型: openrouter/..." (from ensure-config.sh)
# - "agent model: openrouter/..." (from gateway startup)
# - "Unknown model:" (indicates model format issue)
```

## Advanced Usage

### Switching to Custom OpenRouter Models

For any OpenRouter model not explicitly handled in `buildOpenRouterProvider()`:

1. The model will use default context window (128000) and max tokens (8192)
2. Model name will be "OpenRouter Model"
3. If you need specific parameters, add the model to the `isXiaomiModel`, `isStepModel`, or `isLlamaModel` checks in `buildOpenRouterProvider()`

### Environment Variable Override Priority

1. `MODEL_NAME` (primary) - used for configuration
2. `MODEL_ID` (secondary) - used for backward compatibility
3. Default: `xiaomi/mimo-v2-flash` (if neither is set)

## Maintenance

### Adding Support for New Models

If you frequently use a specific OpenRouter model, modify `buildOpenRouterProvider()` in `src/agents/models-config.providers.ts`:

```typescript
const isMyModel = actualModelId.includes("provider/model-id");

if (isMyModel) {
  name = "My Model Display Name";
  contextWindow = 128000; // Set appropriate value
  maxTokens = 8192;       // Set appropriate value
}
```

### Testing Model Switches

1. Start with a known working model (e.g., `openrouter/xiaomi/mimo-v2-flash`)
2. Switch to target model
3. Monitor logs for errors
4. Send a test message to verify the model responds correctly
5. Check that the response mentions the correct model name

## References

- [OpenRouter Model Catalog](https://openrouter.ai/models)
- [Railway Environment Variables](https://docs.railway.app/variables)
- [OpenClaw Configuration](https://github.com/zyj18860969891-byte/openclaw-railway)
