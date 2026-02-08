# Clawd 官方仓库 /app/skills/ 实现机制分析

## 概述

OpenClaw 的技能系统是一个模块化的架构，允许通过多种方式发现、加载和调用技能。技能本质上是包含特定元数据和功能的代码包，可以被 AI 代理自动识别和使用。

## 技能发现机制

### 1. 技能来源

技能从以下几个来源被发现和加载：

#### a) Bundled Skills（内置技能）
- 位置：`skills/` 目录（仓库根目录）
- 这些技能随 OpenClaw 一起分发
- 示例：`github`, `weather`, `notion`, `openai-image-gen` 等

#### b) Extra Directories（额外目录）
- 通过配置 `skills.load.extraDirs` 指定
- 允许用户自定义技能目录
- 优先级低于 bundled skills

#### c) Plugin Skills（插件技能）
- 来自启用的插件（如 feishu, dingtalk）
- 通过 `resolvePluginSkillDirs()` 函数解析
- 插件技能路径在插件的 `openclaw.plugin.json` 中定义

#### d) Workspace Skills（工作区技能）
- 位置：`~/.openclaw/skills/`（用户工作区）
- 用户通过 `npx skills add` 安装的技能
- 优先级最高（会覆盖其他来源的同名技能）

### 2. 技能加载流程

```typescript
// 主要加载函数：loadSkillEntries
export function loadSkillEntries(
  workspaceDir: string,
  opts?: {
    config?: OpenClawConfig;
    managedSkillsDir?: string;
    bundledSkillsDir?: string;
    entries?: SkillEntry[];
    skillFilter?: string[];
    eligibility?: SkillEligibilityContext;
  }
): SkillEntry[]
```

**加载顺序和优先级：**
1. 加载 extra skills（最低优先级）
2. 加载 bundled skills
3. 加载 managed skills（`~/.openclaw/skills/`）
4. 加载 workspace skills（最高优先级）

使用 `Map<string, Skill>` 合并技能，同名技能后面的会覆盖前面的。

### 3. 技能目录结构

每个技能是一个独立的目录，包含：

```
skill-name/
├── SKILL.md          # 技能定义文件（必需）
├── skill.ts          # 技能实现（可选）
├── prompts/          # 提示词模板（可选）
├── tools/           # 工具定义（可选）
└── ...              # 其他资源文件
```

**SKILL.md 格式：**
```markdown
---
name: skill-name
description: "技能描述"
metadata: {"openclaw": {"emoji": "📦", "requires": {"bins": ["gh"]}}}
---

# 技能标题

技能的使用说明和文档...
```

## 技能调用机制

### 1. 技能快照构建

```typescript
export function buildWorkspaceSkillSnapshot(
  workspaceDir: string,
  opts?: SkillSnapshotOptions
): SkillSnapshot
```

构建技能快照的步骤：
1. 加载所有技能条目
2. 过滤符合条件的技能（基于配置、资格等）
3. 提取可用于提示的技能的技能对象
4. 序列化为 JSON 格式供 LLM 使用

### 2. 技能资格检查

```typescript
export function shouldIncludeSkill(params: {
  entry: SkillEntry;
  config?: OpenClawConfig;
  eligibility?: SkillEligibilityContext;
}): boolean
```

检查包括：
- 是否在允许列表中（allowBundled）
- 是否满足平台要求（runtime platform）
- 是否满足二进制依赖（hasBinary）
- 是否满足环境变量要求
- 是否被禁用（disabled）

### 3. 技能在 LLM 对话中的使用

技能通过以下方式被集成到 LLM 提示中：

```typescript
// 在 getReplyFromConfig 中
const skillsSnapshot = buildWorkspaceSkillSnapshot(workspaceDir, {
  config: cfg,
  skillFilter: agentSkills,
  eligibility: eligibility,
});
```

技能信息被格式化为系统提示的一部分，告诉 LLM 有哪些可用技能以及如何使用它们。

## 自动技能安装机制

### 1. 自动安装配置

在 `moltbot.json` 或 `openclaw.json` 中配置：

```json
{
  "skills": {
    "enabled": true,
    "autoInstall": true,
    "sources": [
      {
        "type": "cli",
        "command": "npx skills add",
        "registry": "https://skills.sh"
      }
    ]
  }
}
```

### 2. 自动安装流程

**核心模块：** `src/agents/auto-skill-install.ts`

**主要函数：**
- `detectSkillNeeds(message: string)` - 从用户消息中检测技能需求
- `searchSkills(query: string)` - 从 skills.sh 搜索技能
- `installSkill(skillName, repository)` - 安装技能
- `processSkillNeeds(message, workspaceDir, config)` - 处理技能需求

**触发时机：**
在 `runEmbeddedPiAgent` 函数开始时调用：
```typescript
// src/agents/pi-embedded-runner/run.ts
const skillResults = await processSkillNeeds(
  params.prompt,
  resolvedWorkspace,
  params.config,
  params.requireSkillConfirmation ? async (skill) => {
    log.info(`Auto-install: Found skill ${skill.name} from ${skill.repository}`);
    return true;
  } : undefined
);
```

### 3. 技能关键词映射

```typescript
const skillKeywords: Record<string, string[]> = {
  "image-gen": ["图片", "图像", "生成图片", "文生图", "draw", "image", ...],
  "weather": ["天气", "weather", "forecast", "温度", "降雨", "气候"],
  "github": ["github", "仓库", "repository", "代码", "commit", "pull request"],
  "notion": ["notion", "笔记", "笔记软件", "document"],
  "openai-image-gen": ["dalle", "dall-e", "openai 图片", "GPT 图片"],
  "gemini": ["gemini", "google ai", "google 助手"],
};
```

### 4. 技能安装验证

安装成功后，技能会被安装到 `~/.openclaw/skills/` 目录，并在下次运行时自动加载。

## 技能 CLI 工具

### 1. 技能管理命令

```bash
# 列出所有可用技能
openclaw skills list

# 安装技能
openclaw skills add <owner/repo>

# 移除技能
openclaw skills remove <owner/repo>

# 查看技能信息
openclaw skills info <name>

# 检查技能状态
openclaw skills check
```

### 2. 技能源配置

技能源定义在 `src/cli/skills-config.ts`：

```typescript
export interface SkillSource {
  type: "cli" | "npm" | "git";
  command?: string;
  registry?: string;
  enabled?: boolean;
}
```

默认技能源：
```typescript
{
  type: "cli",
  command: "npx skills add",
  registry: "https://skills.sh",
  enabled: true,
}
```

## 技能与 LLM 的集成

### 1. 系统提示生成

技能信息被注入到系统提示中，格式如下：

```
Available skills:
- github: Interact with GitHub using the `gh` CLI...
- weather: Get weather information...
...
```

### 2. 技能调用检测

LLM 在回复中可以通过特定格式调用技能：

```
```skill
{
  "name": "github",
  "input": {
    "command": "gh issue list --repo owner/repo"
  }
}
```
```

### 3. 技能执行

```typescript
// 在 agent-runner 中处理技能调用
const toolResult = await runTool({
  name: toolName,
  input: toolInput,
  skillsSnapshot,  // 包含所有可用技能
});
```

## 技能依赖管理

### 1. 二进制依赖

技能可以声明所需的二进制文件：

```yaml
metadata:
  openclaw:
    requires:
      bins: ["gh", "jq"]
```

系统会检查这些二进制文件是否在 PATH 中。

### 2. 环境变量

技能可以声明所需的环境变量：

```yaml
metadata:
  openclaw:
    requires:
      env: ["GITHUB_TOKEN", "NOTION_TOKEN"]
```

### 3. 操作系统要求

技能可以指定支持的操作系统：

```yaml
metadata:
  openclaw:
    requires:
      os: ["darwin", "linux"]
```

## 技能安装路径

### 1. 默认安装路径

```typescript
installPath: "~/.openclaw/skills"
```

### 2. 工作区技能

工作区技能位于：
- Windows: `%USERPROFILE%\.openclaw\skills\`
- Linux/macOS: `~/.openclaw/skills/`

### 3. 插件技能

插件技能位于插件目录下：
- `vendor/plugins/<plugin-id>/skills/`

## 技能开发指南

### 1. 创建新技能

1. 创建技能目录：`skills/my-skill/`
2. 创建 `SKILL.md` 文件，包含 frontmatter 和文档
3. 实现技能逻辑（可选）：
   - `skill.ts` - TypeScript 实现
   - `tools/` - 工具定义
4. 测试技能：`openclaw skills list` 查看是否被识别

### 2. 技能元数据

必需的 frontmatter 字段：
- `name`: 技能名称（唯一标识）
- `description`: 简短描述

可选的 openclaw 元数据：
```yaml
metadata:
  openclaw:
    emoji: "🎯"
    requires:
      bins: ["my-cli"]
      env: ["MY_API_KEY"]
    install:
      - id: "brew"
        kind: "brew"
        formula: "my-cli"
      - id: "apt"
        kind: "apt"
        package: "my-cli"
```

### 3. 技能测试

使用 `openclaw skills check` 验证技能是否满足所有要求。

## 总结

OpenClaw 的技能系统是一个灵活、可扩展的架构：

1. **多源发现**：支持内置、插件、工作区等多种技能来源
2. **优先级管理**：工作区技能优先级最高，便于覆盖和自定义
3. **自动安装**：通过 `auto-skill-install` 模块实现智能技能推荐和安装
4. **依赖管理**：完善的二进制、环境变量、操作系统检查
5. **CLI 工具**：提供完整的技能管理命令行界面
6. **LLM 集成**：技能信息自动注入系统提示，支持自然语言调用

这个设计使得 OpenClaw 能够动态扩展功能，用户可以根据需要安装和使用各种技能，而无需修改核心代码。