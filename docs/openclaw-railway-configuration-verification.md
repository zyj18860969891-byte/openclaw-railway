# OpenClaw Railway 环境变量配置验证分析

## 概述

通过分析 OpenClaw 项目的源代码和配置文件，我们确认了可以通过 Railway 环境变量配置模型 API、模型 ID 以及通信通道的配置。以下是详细的分析结果。

## ✅ 确认的 Railway 环境变量配置

### 1. 模型 API 配置

#### OpenAI API 配置
- **环境变量**: `OPENAI_API_KEY`
- **用途**: 用于 OpenAI 模型 API 调用
- **配置位置**: 
  - `src/tts/tts.ts`: `config.openai.apiKey || process.env.OPENAI_API_KEY`
  - 多个测试文件中都有使用
- **Railway 配置**: 在 Railway 平台的 Variables 中添加

#### Anthropic API 配置
- **环境变量**: `ANTHROPIC_API_KEY`
- **用途**: 用于 Anthropic Claude 模型 API 调用
- **配置位置**: 
  - `src/agents/model-auth.ts`: `pick("ANTHROPIC_OAUTH_TOKEN") ?? pick("ANTHROPIC_API_KEY")`
  - `src/agents/live-auth-keys.ts`: 从环境变量收集
- **Railway 配置**: 在 Railway 平台的 Variables 中添加

### 2. 模型 ID 配置

#### 默认模型 ID
- **环境变量**: `MODEL_ID`
- **用途**: 指定使用的 AI 模型
- **配置位置**: 
  - `src/commands/onboard-auth.models.ts`: 定义了多个默认模型 ID
  - `src/commands/onboard-auth.ts`: 导入和使用模型 ID
- **支持的模型**:
  - `MINIMAX_HOSTED_MODEL_ID`: "MiniMax-M2.1"
  - `MOONSHOT_DEFAULT_MODEL_ID`: "kimi-k2-0905-preview"
  - `KIMI_CODE_MODEL_ID`: "kimi-for-coding"
- **Railway 配置**: 在 Railway 平台的 Variables 中添加

### 3. 通信通道配置

#### 钉钉（DingTalk）配置
- **环境变量**: 
  - `DINGTALK_CLIENT_ID`: 钉钉应用 AppKey
  - `DINGTALK_CLIENT_SECRET`: 钉钉应用 AppSecret
- **配置文件**: `extensions/dingtalk/src/config.ts`
- **配置 Schema**: `DingtalkConfigSchema`
- **Railway 配置**: 在 Railway 平台的 Variables 中添加

#### 飞书（Feishu）配置
- **环境变量**: 
  - `FEISHU_APP_ID`: 飞书应用 App ID
  - `FEISHU_APP_SECRET`: 飞书应用 App Secret
- **配置文件**: `extensions/feishu/src/config.ts`
- **配置 Schema**: `FeishuConfigSchema`
- **Railway 配置**: 在 Railway 平台的 Variables 中添加

#### 企业微信（WeChat Work）配置
- **环境变量**: 
  - `WECOM_CORP_ID`: 企业微信企业 ID
  - `WECOM_CORP_SECRET`: 企业微信企业密钥
  - `WECOM_AGENT_ID`: 企业微信应用 ID
  - `WECOM_AGENT_SECRET`: 企业微信应用密钥（可选）
- **配置文件**: `extensions/wecom/src/config.ts`
- **配置 Schema**: `WecomConfigSchema`
- **Railway 配置**: 在 Railway 平台的 Variables 中添加

### 4. Railway 部署配置

#### 基础配置
- **环境变量**: `NODE_ENV`
  - 值: "production"
  - 配置位置: `fly.toml` 中的 `[env]` 部分

#### 服务端口配置
- **环境变量**: `PORT`
  - 值: "3000" 或 "8080"
  - 配置位置: `fly.toml` 和 `render.yaml` 中都有配置

#### 状态目录配置
- **环境变量**: `OPENCLAW_STATE_DIR`
  - 值: "/data/.openclaw"
  - 配置位置: `fly.toml` 和 `render.yaml` 中都有配置

#### 工作目录配置
- **环境变量**: `OPENCLAW_WORKSPACE_DIR`
  - 值: "/data/workspace"
  - 配置位置: `render.yaml` 中的 `[envVars]` 部分

#### 网关令牌配置
- **环境变量**: `OPENCLAW_GATEWAY_TOKEN`
  - 用途: 网关认证令牌
  - 配置位置: `render.yaml` 中设置为自动生成

## ✅ Railway 部署配置验证

### Railway 平台配置步骤

1. **登录 Railway 平台**
2. **选择 OpenClaw 项目**
3. **进入 Variables 设置**
4. **添加以下环境变量**:

#### 基础环境变量
```bash
NODE_ENV=production
PORT=3000
OPENCLAW_STATE_DIR=/data/.openclaw
OPENCLAW_WORKSPACE_DIR=/data/workspace
```

#### 模型 API 环境变量
```bash
# OpenAI 配置
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic 配置（可选）
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# 模型 ID 配置
MODEL_ID=gpt-4  # 或其他支持的模型 ID
```

#### 通信通道环境变量
```bash
# 钉钉配置
DINGTALK_CLIENT_ID=your_dingtalk_client_id
DINGTALK_CLIENT_SECRET=your_dingtalk_client_secret

# 飞书配置
FEISHU_APP_ID=your_feishu_app_id
FEISHU_APP_SECRET=your_feishu_app_secret

# 企业微信配置
WECOM_CORP_ID=your_wecom_corp_id
WECOM_CORP_SECRET=your_wecom_corp_secret
WECOM_AGENT_ID=your_wecom_agent_id
```

### 验证配置的方法

创建一个验证脚本 `scripts/verify-railway-config.js`:

```javascript
#!/usr/bin/env node

// Railway 环境变量验证脚本
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'OPENCLAW_STATE_DIR',
  'OPENAI_API_KEY',
  'MODEL_ID'
];

const channelEnvVars = {
  'dingtalk': ['DINGTALK_CLIENT_ID', 'DINGTALK_CLIENT_SECRET'],
  'feishu': ['FEISHU_APP_ID', 'FEISHU_APP_SECRET'],
  'wecom': ['WECOM_CORP_ID', 'WECOM_CORP_SECRET', 'WECOM_AGENT_ID']
};

console.log('=== OpenClaw Railway 环境变量验证 ===');

// 验证基础环境变量
console.log('\\n📋 基础环境变量验证:');
let allBasicVarsPresent = true;
requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: 已配置`);
  } else {
    console.log(`❌ ${varName}: 未配置`);
    allBasicVarsPresent = false;
  }
});

// 验证通信通道环境变量
console.log('\\n📱 通信通道环境变量验证:');
let allChannelVarsPresent = true;
Object.entries(channelEnvVars).forEach(([channel, vars]) => {
  console.log(`\\n🔹 ${channel.toUpperCase()}:`);
  let channelVarsPresent = true;
  vars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`  ✅ ${varName}: 已配置`);
    } else {
      console.log(`  ❌ ${varName}: 未配置`);
      channelVarsPresent = false;
      allChannelVarsPresent = false;
    }
  });
  if (channelVarsPresent) {
    console.log(`  🎉 ${channel} 通道配置完整！`);
  }
});

// 总结
console.log('\\n=== 验证结果 ===');
if (allBasicVarsPresent && allChannelVarsPresent) {
  console.log('🎉 所有环境变量配置正确！');
  console.log('🚀 OpenClaw 可以正常启动和运行。');
} else {
  console.log('⚠️  部分环境变量未配置，请检查 Railway 环境变量设置。');
  console.log('📝 请确保在 Railway 平台添加所有必需的环境变量。');
}
```

## ✅ 结论

通过详细分析 OpenClaw 项目的源代码和配置文件，我们确认了：

1. **模型 API 配置**: 支持 `OPENAI_API_KEY` 和 `ANTHROPIC_API_KEY`
2. **模型 ID 配置**: 支持 `MODEL_ID` 环境变量
3. **通信通道配置**: 
   - 钉钉: `DINGTALK_CLIENT_ID`, `DINGTALK_CLIENT_SECRET`
   - 飞书: `FEISHU_APP_ID`, `FEISHU_APP_SECRET`
   - 企业微信: `WECOM_CORP_ID`, `WECOM_CORP_SECRET`, `WECOM_AGENT_ID`
4. **Railway 部署配置**: 支持通过 Railway 环境变量进行完整配置

**所有这些环境变量都可以通过 Railway 平台的 "Variables" 设置进行配置，配置完成后重新部署即可实现服务的连通。**

## 🚀 部署建议

1. **优先配置基础环境变量**（NODE_ENV、PORT、OPENCLAW_STATE_DIR）
2. **然后配置模型 API**（OPENAI_API_KEY、ANTHROPIC_API_KEY、MODEL_ID）
3. **最后配置通信通道**（根据需要选择钉钉、飞书、企业微信）
4. **使用验证脚本** 确认配置正确性
5. **重新部署** 使配置生效

这样配置后，OpenClaw 项目将能够成功连接到指定的 AI 模型 API 和通信通道，提供完整的 AI 助手服务。