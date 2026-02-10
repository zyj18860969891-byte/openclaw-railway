# OpenClaw Railway 部署项目完整指南

> 基于 OpenClaw 开源项目的 Railway 云端部署版本，针对中国用户优化，支持飞书、钉钉等国内主流即时通讯平台。

---

## 目录

1. [已实现技能介绍](#1-已实现技能介绍)
2. [项目完整度介绍](#2-项目完整度介绍)
3. [项目优势](#3-项目优势)
4. [项目部署流程](#4-项目部署流程)
5. [相比原生 ClawDBot 的升级与优化](#5-相比原生-clawdbot-的升级与优化)
6. [用户使用流程说明](#6-用户使用流程说明)

---

## 1. 已实现技能介绍

### 📦 内置技能列表（53个）

OpenClaw 通过技能（Skills）系统扩展 AI 助手的能力。每个技能都是一个独立的模块，通过 `SKILL.md` 文件定义使用方式。

### 🌟 核心技能

| 技能名称 | 描述 | 所需依赖 |
|---------|------|---------|
| **weather** 🌤️ | 获取实时天气和预报，无需 API Key | curl |
| **github** 🐙 | GitHub 操作（Issue、PR、CI 状态） | gh CLI |
| **notion** 📝 | Notion 页面和数据库管理 | API Key |
| **obsidian** 💎 | Obsidian 笔记库操作 | obsidian-cli |
| **summarize** | 文本摘要工具 | - |
| **coding-agent** | 代码编写助手 | - |

### 🔧 实用工具技能

| 技能名称 | 描述 | 所需依赖 |
|---------|------|---------|
| **1password** | 1Password 密码管理 | 1Password CLI |
| **apple-notes** | Apple 备忘录 | macOS |
| **apple-reminders** | Apple 提醒事项 | macOS |
| **bear-notes** | Bear 笔记 | macOS |
| **things-mac** | Things 3 任务管理 | macOS |
| **trello** | Trello 看板管理 | API Key |
| **tmux** | TMux 会话管理 | tmux |
| **himalaya** | 邮件管理 | himalaya CLI |

### 🎨 多媒体技能

| 技能名称 | 描述 | 所需依赖 |
|---------|------|---------|
| **spotify-player** 🎵 | Spotify 播放控制 | spotify-tui |
| **sonoscli** | Sonos 音响控制 | sonos-cli |
| **songsee** | 歌词搜索 | - |
| **gifgrep** | GIF 搜索 | - |
| **openai-image-gen** | AI 图像生成 | OpenAI API |
| **openai-whisper** | 语音转文字 | OpenAI API |
| **video-frames** | 视频帧提取 | ffmpeg |
| **camsnap** | 摄像头截图 | - |

### 🌐 网络服务技能

| 技能名称 | 描述 | 所需依赖 |
|---------|------|---------|
| **bird** | Twitter/X 操作 | birdable CLI |
| **slack** | Slack 集成 | - |
| **discord** | Discord 集成 | - |
| **telegram** | Telegram 集成 | - |
| **blucli** | BlueBubbles (iMessage) | - |

### 🏠 智能家居技能

| 技能名称 | 描述 | 所需依赖 |
|---------|------|---------|
| **openhue** | Philips Hue 灯光控制 | Hue Bridge |
| **goplaces** | 位置服务 | - |
| **local-places** | 本地位置搜索 | - |

### 🛠️ 开发者技能

| 技能名称 | 描述 | 所需依赖 |
|---------|------|---------|
| **skill-creator** | 创建新技能 | - |
| **session-logs** | 会话日志 | - |
| **model-usage** | 模型使用统计 | - |
| **oracle** | 数据库查询 | - |
| **clawdhub** | ClawdHub 集成 | - |

### 🍜 特色技能

| 技能名称 | 描述 | 所需依赖 |
|---------|------|---------|
| **food-order** | 食物订购 | - |
| **ordercli** | 订单管理 | - |
| **nano-banana-pro** | 趣味功能 | - |
| **nano-pdf** | PDF 处理 | - |
| **peekaboo** | 屏幕共享 | - |
| **voice-call** | 语音通话 | - |

---

## 2. 项目完整度介绍

### ✅ 已完成功能

#### 核心系统
- [x] **Gateway 网关服务** - WebSocket 连接管理
- [x] **Agent 代理系统** - AI 对话处理
- [x] **技能系统** - 53 个内置技能
- [x] **浏览器控制** - Chromium Headless 支持
- [x] **Canvas 画布** - 实时协作画布

#### 通讯渠道
- [x] **飞书 (Feishu)** - WebSocket 长连接
- [x] **钉钉 (DingTalk)** - Stream 模式连接
- [x] **企业微信 (WeCom)** - 插件支持
- [x] **Telegram** - 插件支持
- [x] **Discord** - 插件支持
- [x] **Slack** - 插件支持
- [x] **iMessage** - 插件支持
- [x] **WhatsApp** - 插件支持
- [x] **Line** - 插件支持

#### AI 模型支持
- [x] **OpenRouter** - 多模型聚合
- [x] **Anthropic Claude** - OAuth + API Key
- [x] **OpenAI** - OAuth + API Key
- [x] **Google Gemini** - API Key
- [x] **自定义模型** - 兼容 OpenAI API

#### 部署支持
- [x] **Railway 云部署** - 完整 Dockerfile
- [x] **Docker 本地部署** - Dockerfile 支持
- [x] **本地开发** - pnpm/bun 支持
- [x] **配置持久化** - /data 目录

### 🔄 进行中功能

- [ ] **更多国内渠道** - 微信公众号等
- [ ] **语音识别优化** - 国内语音服务
- [ ] **更多 AI 模型** - 国产大模型支持

---

## 3. 项目优势

### 🚀 技术优势

#### 1. 云原生部署
```
✅ Railway 一键部署
✅ 自动扩缩容
✅ 高可用架构
✅ 全球 CDN 加速
```

#### 2. 中国本土化
```
✅ 飞书/钉钉原生支持
✅ 国内网络优化
✅ 中文 NLP 优化
✅ 本地化技能支持
```

#### 3. 安全性
```
✅ Token 认证机制
✅ 端到端加密
✅ 私有部署
✅ 数据本地化
```

### 💡 功能优势

| 特性 | OpenClaw | 其他方案 |
|-----|----------|---------|
| 多渠道支持 | 10+ 渠道 | 通常 1-3 个 |
| 技能扩展 | 53+ 内置技能 | 需自行开发 |
| AI 模型 | 支持所有主流模型 | 通常单一模型 |
| 部署方式 | 云端/本地/混合 | 通常单一方式 |
| 开源程度 | 完全开源 | 部分开源或闭源 |

### 🎯 适用场景

1. **个人助理** - 日常任务管理、信息查询
2. **团队协作** - 多渠道消息聚合、自动化工作流
3. **开发调试** - 代码助手、CI/CD 集成
4. **智能家居** - 设备控制、场景联动
5. **内容创作** - 写作辅助、素材收集

---

## 4. 项目部署流程

### 📋 前置要求

- Railway 账号（免费或付费）
- GitHub 账号（代码托管）
- 飞书/钉钉开发者账号（可选）

### 🚀 快速部署

#### 步骤 1: Fork 项目

```bash
# 克隆项目
git clone https://github.com/your-username/openclaw-railway.git
cd openclaw-railway/openclaw-main
```

#### 步骤 2: 配置 Railway

1. 登录 [Railway](https://railway.app)
2. 创建新项目
3. 选择 "Deploy from GitHub repo"
4. 选择 Fork 的仓库

#### 步骤 3: 配置环境变量

在 Railway Dashboard 中设置：

```env
# 必需
NODE_ENV=production
MODEL_NAME=openrouter/stepfun/step-3.5-flash:free

# 飞书配置
FEISHU_ENABLED=true
FEISHU_APP_ID=cli_xxxxx
FEISHU_APP_SECRET=xxxxx

# 钉钉配置
DINGTALK_ENABLED=true
DINGTALK_CLIENT_ID=dingxxxxx
DINGTALK_CLIENT_SECRET=xxxxx

# Gateway 认证
GATEWAY_AUTH_MODE=token
OPENCLAW_GATEWAY_TOKEN=your-secure-token
```

#### 步骤 4: 部署

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 部署
railway up
```

#### 步骤 5: 验证部署

```bash
# 检查日志
railway logs

# 测试连接
curl https://your-app.railway.app/health
```

### 📁 关键文件说明

```
openclaw-main/
├── Dockerfile.railway    # Railway 专用 Dockerfile
├── railway.toml          # Railway 配置文件
├── fix-plugin-config.sh  # 插件配置脚本
├── skills/               # 内置技能目录
├── extensions/           # 渠道插件目录
│   ├── feishu/          # 飞书插件
│   └── dingtalk/        # 钉钉插件
└── src/                  # 源代码
```

---

## 5. 相比原生 ClawDBot 的升级与优化

### 🔄 架构升级

| 方面 | 原生 ClawDBot | OpenClaw Railway |
|-----|--------------|------------------|
| **部署方式** | 本地运行 | 云端部署 + 本地可选 |
| **运行环境** | 需要 Node.js 环境 | Docker 容器化 |
| **配置管理** | 手动编辑 JSON | 环境变量优先 |
| **持久化** | 本地文件 | 云端持久化卷 |
| **扩展性** | 单机限制 | 云端弹性扩展 |

### 🇨🇳 中国本土化优化

#### 1. 渠道支持
```
原生: WhatsApp, Telegram, Discord, Slack
优化: + 飞书, 钉钉, 企业微信
```

#### 2. 网络优化
```
原生: 国际网络优先
优化: 国内 CDN 加速, 代理支持
```

#### 3. 模型支持
```
原生: Claude, OpenAI
优化: + OpenRouter, 国产模型
```

### 🛠️ 易用性优化

#### 1. 配置简化

**原生方式:**
```json
// 需要手动编辑 ~/.openclaw/openclaw.json
{
  "channels": {
    "feishu": {
      "enabled": true,
      "appId": "...",
      "appSecret": "..."
    }
  }
}
```

**优化方式:**
```bash
# 环境变量自动配置
FEISHU_ENABLED=true
FEISHU_APP_ID=cli_xxxxx
FEISHU_APP_SECRET=xxxxx
```

#### 2. 一键部署

**原生方式:**
```bash
# 需要多步操作
git clone ...
cd openclaw
pnpm install
pnpm build
pnpm openclaw gateway
```

**优化方式:**
```bash
# Railway 一键部署
railway up
```

#### 3. 自动配置生成

- ✅ 自动生成飞书/钉钉配置
- ✅ 自动复制内置技能
- ✅ 自动配置浏览器环境
- ✅ 自动设置认证 Token

### 📊 性能优化

| 优化项 | 说明 |
|-------|------|
| **日志优化** | 减少重复日志，防止日志风暴 |
| **连接池** | WebSocket 连接复用 |
| **缓存** | 配置缓存，减少 IO |
| **内存** | 容器内存优化 |

### 🔐 安全优化

| 优化项 | 说明 |
|-------|------|
| **Token 认证** | 简化认证流程 |
| **代理信任** | Railway 代理配置 |
| **沙箱禁用** | 云端环境适配 |
| **敏感信息** | 环境变量管理 |

---

## 6. 用户使用流程说明

### 👤 新用户入门

#### 第一步：获取访问权限

1. 联系管理员获取：
   - Gateway URL（如 `https://your-app.railway.app`）
   - 认证 Token

2. 或自行部署（参考第4节）

#### 第二步：连接渠道

##### 飞书连接

1. 在飞书开放平台创建企业自建应用
2. 配置事件订阅：
   - URL: `https://your-app.railway.app/webhook/feishu`
3. 添加权限：
   - 获取用户消息
   - 发送消息
4. 发布应用到企业

##### 钉钉连接

1. 在钉钉开放平台创建企业内部应用
2. 配置 Stream 模式（无需公网 IP）
3. 添加权限：
   - 企业内消息通知
   - 通讯录只读权限
4. 发布应用

#### 第三步：开始使用

##### 基础对话

```
用户: 你好，请帮我查询明天的天气
AI: 好的，我来帮你查询明天的天气...
    [使用 weather 技能]
    明天北京：晴，温度 15-25°C，湿度 45%
```

##### 技能调用

```
用户: 帮我在 GitHub 上创建一个 Issue
AI: 好的，请告诉我仓库地址和 Issue 内容...
    [使用 github 技能]
    Issue #123 已创建: https://github.com/...
```

##### 浏览器操作

```
用户: 帮我搜索小红书上关于 OpenClaw 的推文
AI: 好的，我来搜索...
    [使用浏览器技能]
    找到以下相关推文：
    1. @user1: OpenClaw 真的很好用...
    2. @user2: 终于有国产的 AI 助手了...
```

### 🎯 常用场景示例

#### 场景 1: 日常助手

```
用户: 帮我记一下明天下午3点有个会议
AI: 已添加到提醒事项：
    - 时间：明天 15:00
    - 内容：会议
    需要设置提前提醒吗？
```

#### 场景 2: 代码助手

```
用户: 帮我看看这个 PR 的 CI 状态
AI: [使用 github 技能]
    PR #456 CI 状态：
    ✅ Tests: 通过
    ✅ Build: 通过
    ❌ Lint: 失败 (3 个问题)
    需要我帮你查看具体的 Lint 错误吗？
```

#### 场景 3: 信息查询

```
用户: 帮我查一下最近的技术新闻
AI: [使用浏览器技能]
    以下是最近的技术新闻：
    1. OpenAI 发布 GPT-5...
    2. Anthropic Claude 3.5...
    3. Google Gemini 2.0...
    需要我详细解读某条新闻吗？
```

### ⚙️ 高级功能

#### 自定义技能

1. 创建技能目录：
```bash
mkdir -p ~/.openclaw/skills/my-skill
```

2. 编写 SKILL.md：
```markdown
---
name: my-skill
description: 我的自定义技能
---

# My Skill

这是一个自定义技能的说明...
```

3. 重启 Gateway 即可使用

#### 多模型切换

```
用户: 切换到 Claude 模型
AI: 已切换到 Claude 3.5 Sonnet
    现在的回答将使用 Claude 模型
```

#### 会话管理

```
用户: 开始新会话
AI: 已创建新会话
    会话 ID: session-abc123
    之前的对话历史已清空
```

### 📱 移动端使用

1. **飞书移动端**：直接在飞书 App 中与机器人对话
2. **钉钉移动端**：在钉钉 App 中与机器人对话
3. **Web 端**：通过 Control UI 访问

### 🔧 故障排除

#### 常见问题

1. **机器人无响应**
   - 检查网络连接
   - 确认服务状态
   - 查看错误日志

2. **技能调用失败**
   - 检查依赖是否安装
   - 确认 API Key 配置
   - 查看技能文档

3. **浏览器功能异常**
   - 确认 Chromium 已安装
   - 检查 headless 模式
   - 查看内存使用

---

## 📞 支持与反馈

- **GitHub Issues**: [提交问题](https://github.com/your-repo/issues)
- **文档**: [在线文档](https://docs.openclaw.ai)
- **社区**: [Discord](https://discord.gg/clawd)

---

## 📄 许可证

本项目基于 MIT 许可证开源。

---

*最后更新: 2026年2月11日*
