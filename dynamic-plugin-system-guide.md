# OpenClaw 动态插件构建系统 - 部署指南

## 概述

本系统实现了 OpenClaw 的动态插件构建和部署，支持通过环境变量来控制哪些通道插件被包含在最终的构建中。这大大减少了部署包的大小，并提供了灵活的通道选择能力。

## 支持的通道

系统支持以下 9 个主要通道：

| 通道名称 | 环境变量 | 插件包名 |
|---------|---------|---------|
| 飞书 | `FEISHU_ENABLED` | `@openclaw/feishu` |
| 钉钉 | `DINGTALK_ENABLED` | `@openclaw/dingtalk` |
| 微信工作 | `WECOM_ENABLED` | `@openclaw/wecom` |
| Telegram | `TELEGRAM_ENABLED` | `@openclaw/telegram` |
| Discord | `DISCORD_ENABLED` | `@openclaw/discord` |
| Slack | `SLACK_ENABLED` | `@openclaw/slack` |
| iMessage | `IMESSAGE_ENABLED` | `@openclaw/imessage` |
| WhatsApp | `WHATSAPP_ENABLED` | `@openclaw/whatsapp` |
| Line | `LINE_ENABLED` | `@openclaw/line` |

## 系统组件

### 1. 构建脚本 (`scripts/build-enabled-plugins.ts`)

根据环境变量动态构建启用的插件：

```bash
# 构建所有启用的插件
node --import tsx scripts/build-enabled-plugins.ts
```

### 2. 复制脚本 (`scripts/copy-plugins.ts`)

将构建好的插件复制到 `dist/channels/` 目录：

```bash
# 复制启用的插件
node --import tsx scripts/copy-plugins.ts

# 启用特定通道
FEISHU_ENABLED=true node --import tsx scripts/copy-plugins.ts

# 启用多个通道
FEISHU_ENABLED=true DINGTALK_ENABLED=true node --import tsx scripts/copy-plugins.ts
```

### 3. 测试脚本 (`scripts/test-plugin-system.ts`)

测试动态插件系统：

```bash
node --import tsx scripts/test-plugin-system.ts
```

### 4. 验证脚本 (`scripts/final-verification.ts`)

最终验证系统状态：

```bash
node --import tsx scripts/final-verification.ts
```

## 部署流程

### Railway 部署

在 Railway 部署中，可以通过环境变量来控制启用的通道：

1. 在 Railway 控制面板中设置环境变量
2. Railway 会自动运行 `package.json` 中的 `build` 脚本
3. 构建脚本会根据环境变量动态构建和复制插件

### 本地部署

```bash
# 1. 构建启用的插件
node --import tsx scripts/build-enabled-plugins.ts

# 2. 复制插件到 dist/channels
node --import tsx scripts/copy-plugins.ts

# 3. 验证部署
node --import tsx scripts/final-verification.ts
```

## 环境变量配置示例

### 单通道部署
```bash
# 仅飞书
export FEISHU_ENABLED=true
```

### 多通道部署
```bash
# 飞书 + 钉钉 + 微信工作
export FEISHU_ENABLED=true
export DINGTALK_ENABLED=true
export WECOM_ENABLED=true
```

### 全通道部署
```bash
# 所有通道
export FEISHU_ENABLED=true
export DINGTALK_ENABLED=true
export WECOM_ENABLED=true
export TELEGRAM_ENABLED=true
export DISCORD_ENABLED=true
export SLACK_ENABLED=true
export IMESSAGE_ENABLED=true
export WHATSAPP_ENABLED=true
export LINE_ENABLED=true
```

## 故障排除

### 插件未构建

如果某个插件未正确构建，请手动构建：

```bash
# 构建特定插件
cd extensions/feishu
tsc --outDir dist
```

### 插件未复制

如果插件未正确复制，请检查环境变量设置：

```bash
# 检查环境变量
echo $FEISHU_ENABLED

# 重新复制插件
node --import tsx scripts/copy-plugins.ts
```

### 验证部署状态

```bash
# 检查 dist/channels 目录
ls -la dist/channels

# 运行验证脚本
node --import tsx scripts/final-verification.ts
```

## 性能优化

1. **减少构建时间**：只构建启用的插件，显著减少构建时间
2. **减少部署包大小**：只包含需要的通道插件，减少部署包大小
3. **灵活的通道选择**：可以根据需要动态选择启用的通道

## 扩展支持

要添加新的通道支持：

1. 在 `scripts/copy-plugins.ts` 中添加新的通道映射
2. 确保插件目录存在
3. 更新环境变量映射
4. 测试新通道的构建和复制

## 总结

这个动态插件构建系统提供了：

- ✅ **灵活性**：通过环境变量动态控制启用的通道
- ✅ **效率**：只构建和部署需要的插件，减少构建时间和包大小
- ✅ **可维护性**：清晰的脚本结构和验证机制
- ✅ **可扩展性**：易于添加新的通道支持

系统已经过全面测试，支持所有主要通道的动态构建和部署。