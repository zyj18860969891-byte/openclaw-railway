# OpenClaw Skills 技能与 LLM、记忆体的协调机制

## 1. 技能如何被发现和加载

### 1.1 技能发现的多源机制

```typescript
// src/agents/skills/workspace.ts
export function loadSkillEntries(
  workspaceDir: string,
  opts?: SkillEntryOptions
): SkillEntry[]
```

**技能来源（按优先级从低到高）：**

1. **Bundled Skills（内置技能）**
   - 位置：`skills/` 目录（仓库根目录）
   - 通过 `resolveBundledSkillsDir()` 解析
   - 示例：github, weather, notion 等
   - 源标识：`"openclaw-bundled"`

2. **Extra Directories（额外目录）**
   - 配置：`skills.load.extraDirs`
   - 用户自定义技能目录
   - 源标识：`"openclaw-extra"`

3. **Plugin Skills（插件技能）**
   - 来自启用的插件（feishu, dingtalk 等）
   - 通过 `resolvePluginSkillDirs()` 解析
   - 插件在 `openclaw.plugin.json` 中定义技能路径
   - 源标识：`"openclaw-plugin"`

4. **Workspace Skills（工作区技能）**
   - 位置：`~/.openclaw/skills/`
   - 用户通过 `npx skills add` 安装
   - 源标识：`"openclaw-managed"`

5. **Session Workspace Skills（会话工作区技能）**
   - 位置：`<workspaceDir>/skills/`
   - 临时工作区技能
   - 源标识：`"openclaw-workspace"`

### 1.2 加载流程

```typescript
const loadSkills = (params: { dir: string; source: string }) => {
  const loaded = loadSkillsFromDir(params);
  // loadSkillsFromDir 来自 @mariozechner/pi-coding-agent
  // 返回 Skill[] 或 { skills: Skill[] }
};

// 1. 加载各来源技能
const bundledSkills = bundledSkillsDir ? loadSkills({ dir: bundledSkillsDir, source: "openclaw-bundled" }) : [];
const extraSkills = mergedExtraDirs.flatMap(dir => loadSkills({ dir: resolveUserPath(dir), source: "openclaw-extra" }));
const managedSkills = loadSkills({ dir: managedSkillsDir, source: "openclaw-managed" });
const workspaceSkills = loadSkills({ dir: workspaceSkillsDir, source: "openclaw-workspace" });

// 2. 合并（优先级：extra < bundled < managed < workspace）
const merged = new Map<string, Skill>();
for (const skill of extraSkills) merged.set(skill.name, skill);
for (const skill of bundledSkills) merged.set(skill.name, skill);
for (const skill of managedSkills) merged.set(skill.name, skill);
for (const skill of workspaceSkills) merged.set(skill.name, skill);

// 3. 构建 SkillEntry（包含 frontmatter 解析）
const skillEntries: SkillEntry[] = Array.from(merged.values()).map(skill => {
  const raw = fs.readFileSync(skill.filePath, "utf-8");
  const frontmatter = parseFrontmatter(raw);
  return {
    skill,
    frontmatter,
    metadata: resolveOpenClawMetadata(frontmatter),
    invocation: resolveSkillInvocationPolicy(frontmatter),
  };
});
```

### 1.3 技能文件结构

每个技能目录包含：
```
skill-name/
├── SKILL.md          # 必需：包含 frontmatter 和文档
├── skill.ts          # 可选：技能实现代码
├── prompts/          # 可选：提示词模板
├── tools/           # 可选：工具定义
└── ...              # 其他资源
```

**SKILL.md frontmatter 示例：**
```yaml
---
name: github
description: "Interact with GitHub using the `gh` CLI"
metadata:
  openclaw:
    emoji: "🐙"
    requires:
      bins: ["gh"]           # 依赖的二进制文件
      env: ["GITHUB_TOKEN"]  # 需要的环境变量
    install:
      - id: "brew"
        kind: "brew"
        formula: "gh"
      - id: "apt"
        kind: "apt"
        package: "gh"
---
```

## 2. 技能如何被 LLM 调用

### 2.1 技能快照构建

```typescript
// src/agents/skills/workspace.ts
export function buildWorkspaceSkillSnapshot(
  workspaceDir: string,
  opts?: SkillSnapshotOptions
): SkillSnapshot
```

**构建步骤：**

1. **加载所有技能条目**
   ```typescript
   const skillEntries = opts?.entries ?? loadSkillEntries(workspaceDir, opts);
   ```

2. **过滤符合条件的技能**
   ```typescript
   const eligible = filterSkillEntries(
     skillEntries,
     opts?.config,
     opts?.skillFilter,
     opts?.eligibility
   );
   ```

3. **提取可用于提示的技能**
   ```typescript
   const promptEntries = eligible.filter(
     entry => entry.invocation?.disableModelInvocation !== true
   );
   ```

4. **序列化**
   ```typescript
   const resolvedSkills = promptEntries.map(entry => entry.skill);
   return {
     version: opts?.snapshotVersion ?? 1,
     generatedAtMs: Date.now(),
     eligibleSkills: resolvedSkills,
     allSkills: skillEntries.map(entry => entry.skill),
   };
   ```

### 2.2 资格检查

```typescript
export function shouldIncludeSkill(params: {
  entry: SkillEntry;
  config?: OpenClawConfig;
  eligibility?: SkillEligibilityContext;
}): boolean
```

**检查项：**
- ✅ 是否在允许列表中（`allowBundled`）
- ✅ 是否满足平台要求（`runtime platform`）
- ✅ 是否满足二进制依赖（`hasBinary`）
- ✅ 是否满足环境变量要求
- ✅ 是否被禁用（`disabled`）
- ✅ 是否满足 OS 要求

### 2.3 系统提示注入

在 `getReplyFromConfig` 中构建系统提示：

```typescript
// src/auto-reply/reply/get-reply.ts
const skillsSnapshot = buildWorkspaceSkillSnapshot(workspaceDir, {
  config: cfg,
  skillFilter: agentSkills,
  eligibility: eligibility,
});

const systemPrompt = `
${baseSystemPrompt}

## 可用技能

${formatSkillsForPrompt(skillsSnapshot.eligibleSkills)}

### 技能使用指南

当你需要执行以下操作时，可以使用相应技能：
${skillsSnapshot.eligibleSkills.map(skill =>
  `- ${skill.name}: ${skill.description}`
).join('\n')}

### 调用技能格式

\`\`\`skill
{
  "name": "skill-name",
  "input": {
    // 技能特定的输入参数
  }
}
\`\`\`
`;
```

### 2.4 LLM 调用技能

LLM 在回复中生成技能调用块：

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

### 2.5 技能执行

```typescript
// src/auto-reply/reply/agent-runner-execution.ts
const toolResult = await runTool({
  name: toolName,
  input: toolInput,
  skillsSnapshot,
});
```

`runTool` 在 `@mariozechner/pi-coding-agent` 包中实现，它会：
1. 在 `skillsSnapshot` 中查找对应技能
2. 加载技能实现（`skill.ts`）
3. 执行技能逻辑
4. 返回结果给 LLM

## 3. 技能与记忆体的交互

### 3.1 记忆体插槽分配

```typescript
// src/agents/skills/plugin-skills.ts
const memorySlot = normalizedPlugins.slots.memory;
let selectedMemoryPluginId: string | null = null;

for (const record of registry.plugins) {
  if (!record.skills || record.skills.length === 0) continue;
  const memoryDecision = resolveMemorySlotDecision({
    id: record.id,
    kind: record.kind,
    slot: memorySlot,
    selectedId: selectedMemoryPluginId,
  });
  
  if (memoryDecision.selected && record.kind === "memory") {
    selectedMemoryPluginId = record.id;  // 只有一个记忆体能被选中
  }
  
  // 技能路径解析...
}
```

**记忆体插槽机制：**
- 只有一个记忆体插件可以被激活
- 记忆体插槽用于存储会话状态
- 技能可以依赖记忆体来存储数据

### 3.2 技能状态存储

技能可以使用记忆体来：
- 存储用户偏好
- 缓存 API 响应
- 保存临时数据
- 维护会话上下文

### 3.3 会话隔离

每个会话有独立的工作区：
```typescript
const workspaceDir = resolveAgentWorkspaceDir(config, agentId);
// 通常为：~/.openclaw/workspaces/<agent-id>/
```

技能在各自的工作区中运行，确保数据隔离。

## 4. 技能快照（Snapshot）的作用

### 4.1 快照内容

```typescript
type SkillSnapshot = {
  version: number;
  generatedAtMs: number;
  eligibleSkills: Skill[];   // 可被 LLM 调用的技能
  allSkills: Skill[];        // 所有已加载的技能
};
```

### 4.2 快照用途

1. **LLM 提示生成**
   - 将可用技能信息注入系统提示
   - LLM 根据快照决定调用哪些技能

2. **运行时验证**
   - 在执行技能调用前验证技能是否存在
   - 检查技能是否被禁用

3. **缓存优化**
   - 避免每次请求都重新扫描文件系统
   - 可设置快照版本，变更时自动刷新

4. **资格过滤**
   - 只包含满足所有依赖的可用技能
   - 排除不满足平台、二进制、环境要求的技能

### 4.3 快照生命周期

```typescript
// 在 agent-runner 中
const skillsSnapshot = await buildWorkspaceSkillSnapshot(workspaceDir, {
  config: cfg,
  skillFilter: agentSkills,
  eligibility: getEligibilityContext(params),
});

// 如果安装了新技能，需要重新构建快照
if (skillResults.installed.length > 0) {
  skillsSnapshot = await buildWorkspaceSkillSnapshot(workspaceDir, {
    config: cfg,
    skillFilter: agentSkills,
    eligibility: getEligibilityContext(params),
  });
}
```

## 5. 整个协调流程的时序

### 5.1 完整流程时序图

```
用户消息
   ↓
[Agent 启动]
   ↓
loadSkillEntries()
   ├── 扫描 bundled skills/
   ├── 扫描 extra dirs
   ├── 扫描 plugin skills
   ├── 扫描 managed skills (~/.openclaw/skills)
   └── 扫描 workspace skills
   ↓
buildWorkspaceSkillSnapshot()
   ├── filterSkillEntries() - 资格检查
   ├── 检查二进制依赖
   ├── 检查环境变量
   └── 检查 OS 兼容性
   ↓
formatSkillsForPrompt() → 注入系统提示
   ↓
LLM 推理
   ↓
LLM 生成技能调用块
   ↓
runTool(toolName, input, skillsSnapshot)
   ├── 在 snapshot 中查找技能
   ├── 加载 skill.ts
   ├── 执行技能逻辑
   └── 返回结果
   ↓
LLM 处理结果并生成最终回复
```

### 5.2 关键代码路径

**1. 技能加载（启动时）**
```typescript
// src/agents/skills/workspace.ts:loadSkillEntries()
→ resolvePluginSkillDirs()
→ loadSkillsFromDir()  // 来自 pi-coding-agent
→ parseFrontmatter()
→ 构建 SkillEntry[]
```

**2. 快照构建（每次推理）**
```typescript
// src/auto-reply/reply/agent-runner-execution.ts
const skillsSnapshot = await buildWorkspaceSkillSnapshot(workspaceDir, {
  config: cfg,
  skillFilter: agentSkills,
  eligibility: getEligibilityContext(params),
});
```

**3. 系统提示注入**
```typescript
// src/auto-reply/reply/get-reply-run.ts:runPreparedReply()
→ getReplyFromConfig()
  → 构建 systemPrompt 包含 skillsSnapshot
```

**4. 技能调用执行**
```typescript
// src/auto-reply/reply/agent-runner-execution.ts:runAgentTurnWithFallback()
→ runTool({ name, input, skillsSnapshot })
  → 在 @mariozechner/pi-coding-agent 中执行
```

**5. 自动技能安装（按需）**
```typescript
// src/agents/pi-embedded-runner/run.ts
const skillResults = await processSkillNeeds(
  params.prompt,
  resolvedWorkspace,
  params.config,
  userConfirmation
);

if (skillResults.installed.length > 0) {
  // 重新构建快照以包含新技能
  skillsSnapshot = await buildWorkspaceSkillSnapshot(workspaceDir, ...);
}
```

### 5.3 数据流

```
文件系统 (skills/*/SKILL.md)
   ↓
loadSkillEntries() → SkillEntry[]
   ↓
filterSkillEntries() → 过滤后的 SkillEntry[]
   ↓
buildWorkspaceSkillSnapshot() → SkillSnapshot
   ↓
formatSkillsForPrompt() → 字符串（注入系统提示）
   ↓
LLM 输入（包含技能列表）
   ↓
LLM 输出（技能调用块）
   ↓
runTool() → 执行具体技能
   ↓
结果返回 LLM → 最终回复
```

## 6. 协调机制的关键设计

### 6.1 分离关注点

- **发现层**：`loadSkillEntries` - 从文件系统发现技能
- **过滤层**：`filterSkillEntries` - 基于配置和资格过滤
- **快照层**：`buildWorkspaceSkillSnapshot` - 构建 LLM 可用的视图
- **提示层**：`formatSkillsForPrompt` - 格式化为 LLM 可理解的形式
- **执行层**：`runTool` - 实际执行技能逻辑

### 6.2 缓存策略

- 技能快照在单次推理中复用
- 文件系统扫描只在快照构建时进行
- 可基于文件修改时间优化缓存

### 6.3 扩展性

- 新技能只需添加到 `skills/` 目录
- 无需修改核心代码
- 支持插件系统动态添加技能源

### 6.4 安全性

- 技能资格检查防止恶意技能执行
- 二进制依赖检查确保环境安全
- 记忆体插槽避免冲突

## 7. 总结

OpenClaw 的技能系统通过以下方式实现与 LLM、记忆体的协调：

1. **多源发现**：支持内置、插件、工作区等多种技能来源
2. **快照机制**：构建技能的快照视图，供 LLM 决策使用
3. **系统提示注入**：将技能信息注入 LLM 上下文
4. **工具调用**：LLM 通过特定格式调用技能
5. **执行验证**：运行时验证技能可用性
6. **记忆体集成**：通过插槽机制管理记忆体插件

整个设计遵循**分离关注点**和**依赖注入**原则，使得系统高度可扩展且易于维护。