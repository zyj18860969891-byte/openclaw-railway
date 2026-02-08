# 自动技能安装与现有协调机制的集成分析

## 1. 问题诊断

### 1.1 原有调用链时序问题

```
用户消息 → getReplyFromConfig()
  ↓
runPreparedReply()  ← 技能快照在这里构建
  ↓
ensureSkillSnapshot()  ← 构建技能快照（基于当前已安装技能）
  ↓
skillsSnapshot 传入
  ↓
runAgentTurnWithFallback()
  ↓
runEmbeddedPiAgent()   ← 自动安装发生在这里（太晚了！）
  ↓
processSkillNeeds()    ← 新技能此时才安装
```

**核心问题**：
- 技能快照在 `ensureSkillSnapshot()` 中构建
- 自动技能安装在 `runEmbeddedPiAgent()` 内部执行
- 新安装的技能**不会**出现在当前会话的 LLM 系统提示中
- LLM 无法使用刚安装的技能

### 1.2 影响范围

```
用户： "帮我查看 GitHub 上的 issue"
  ↓
系统：检测到需要 github 技能
  ↓
自动安装：在 runEmbeddedPiAgent 中安装 github 技能
  ↓
问题：此时技能快照已构建完成，不包含 github 技能
  ↓
LLM：看不到 github 技能，无法调用
  ↓
结果：安装成功但无法使用（需要下一次对话）
```

## 2. 解决方案

### 2.1 集成策略

**核心思想**：在技能快照构建之前触发自动技能安装

```
用户消息 → getReplyFromConfig()
  ↓
runPreparedReply()  ← 在这里添加自动安装逻辑
  ↓
[自动技能检测和安装]  ← 新增：在快照构建前执行
  ↓
ensureSkillSnapshot()  ← 构建快照（包含新安装的技能）
  ↓
skillsSnapshot 传入
  ↓
runEmbeddedPiAgent()  ← 不再需要自动安装逻辑
  ↓
```

### 2.2 实现位置

**文件**：`src/auto-reply/reply/get-reply-run.ts`

**函数**：`runPreparedReply`

**插入点**：在调用 `ensureSkillSnapshot()` 之前

## 3. 具体实现

### 3.1 修改 get-reply-run.ts

#### 步骤1：导入自动技能安装模块

```typescript
// 在文件顶部添加
import { processSkillNeeds } from "../../agents/auto-skill-install.js";
```

#### 步骤2：在 ensureSkillSnapshot 前添加自动安装逻辑

```typescript
// 在调用 ensureSkillSnapshot 之前插入
if (cfg?.skills?.autoInstall && params.commandBody) {
  try {
    const skillResults = await processSkillNeeds(
      params.commandBody,
      workspaceDir,
      cfg,
      cfg.skills?.requireUserConfirmation ? async (skill) => {
        console.log(`[Auto-install] Found skill ${skill.name} from ${skill.repository}`);
        return true;
      } : undefined
    );

    if (skillResults.installed.length > 0) {
      console.log(`[Auto-install] Installed skills: ${skillResults.installed.join(", ")}`);
      // ensureSkillSnapshot 会检测到技能版本变化并自动重新构建快照
    }

    if (skillResults.errors.length > 0) {
      console.warn(`[Auto-install] Errors: ${skillResults.errors.join(", ")}`);
    }
  } catch (skillError) {
    console.warn(`Auto-install: Failed to process skill needs: ${skillError}`);
  }
}
```

### 3.2 移除重复的自动安装代码

**文件**：`src/agents/pi-embedded-runner/run.ts`

**修改**：删除或注释掉 `processSkillNeeds` 的调用，因为现在在更早的时机处理

```typescript
// 原来的代码（可以保留作为后备，但建议删除以避免重复）
// const skillResults = await processSkillNeeds(...);
```

## 4. 协调机制工作流程

### 4.1 完整流程（集成后）

```
1. 用户发送消息
   "帮我查看 GitHub 上的 issue"

2. getReplyFromConfig() 接收消息
   ↓

3. runPreparedReply() 开始执行
   ↓

4. 【新增】自动技能检测
   - 分析消息："GitHub" → 需要 github 技能
   - 检查是否已安装：未安装
   - 执行：npx skills add openclaw/skills-github
   - 安装到 ~/.openclaw/skills/github/
   ↓

5. ensureSkillSnapshot() 构建快照
   - 检测到技能目录变化（版本号增加）
   - 重新加载所有技能
   - 包含新安装的 github 技能
   - 序列化为 LLM 可读格式
   ↓

6. LLM 系统提示注入
   ```
   可用技能：
   - github: 使用 gh CLI 与 GitHub 交互...
   - weather: 获取天气信息...
   ...
   ```
   ↓

7. LLM 推理
   - 分析任务：需要访问 GitHub
   - 决定调用 github 技能
   - 生成技能调用：
     ```skill
     {"name":"github","input":{"command":"gh issue list"}}
     ```
   ↓

8. 技能执行
   - 解析技能调用
   - 检查 gh 二进制（存在）
   - 执行命令
   - 返回结果给 LLM
   ↓

9. LLM 格式化回复
   - 处理技能返回的数据
   - 生成自然语言回复
   ↓

10. 返回给用户
    "以下是您的 GitHub issue 列表：..."
```

### 4.2 关键协调点

| 阶段 | 组件 | 协调方式 | 数据流 |
|------|------|---------|--------|
| **意图检测** | auto-skill-install | 关键词匹配 | 用户消息 → 技能需求 |
| **技能安装** | skills CLI | npx skills add | 远程仓库 → 本地安装 |
| **快照构建** | workspace.ts | 扫描技能目录 | 文件系统 → 技能快照 |
| **LLM 集成** | get-reply.ts | 系统提示注入 | 技能快照 → LLM 上下文 |
| **技能调用** | agent-runner | 工具执行 | LLM 输出 → 技能执行 |
| **结果返回** | agent-runner | 结果格式化 | 技能输出 → LLM → 用户 |

## 5. 技术细节

### 5.1 技能快照版本控制

```typescript
// src/agents/skills/workspace.ts
export function getSkillsSnapshotVersion(workspaceDir: string): number {
  // 检查技能目录的修改时间
  // 返回版本号（基于时间戳或计数器）
  // 用于检测技能变化
}

// 在 ensureSkillSnapshot 中
const shouldRefreshSnapshot =
  snapshotVersion > 0 && (nextEntry?.skillsSnapshot?.version ?? 0) < snapshotVersion;

if (shouldRefreshSnapshot) {
  // 重新构建快照，包含新技能
  const skillSnapshot = buildWorkspaceSkillSnapshot(workspaceDir, {
    config: cfg,
    snapshotVersion,
  });
}
```

### 5.2 自动安装配置

```json
{
  "skills": {
    "enabled": true,
    "autoInstall": true,
    "requireUserConfirmation": false,  // 可选：是否需要用户确认
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

### 5.3 技能检测算法

```typescript
// src/agents/auto-skill-install.ts
const skillKeywords: Record<string, string[]> = {
  "image-gen": ["图片", "图像", "生成图片", "draw", "image", ...],
  "weather": ["天气", "weather", "forecast", ...],
  "github": ["github", "仓库", "repository", "代码", ...],
  "notion": ["notion", "笔记", "document", ...],
  // ...
};

export function detectSkillNeeds(message: string): string[] {
  const detectedSkills: string[] = [];
  const lowerMessage = message.toLowerCase();

  for (const [skillName, keywords] of Object.entries(skillKeywords)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        if (!detectedSkills.includes(skillName)) {
          detectedSkills.push(skillName);
        }
        break;
      }
    }
  }

  return detectedSkills;
}
```

## 6. 优势与改进

### 6.1 即时可用性

- ✅ 技能安装后立即在当前会话中可用
- ✅ 无需等待下一次对话
- ✅ 用户体验无缝衔接

### 6.2 一致性

- ✅ 技能快照始终反映当前安装状态
- ✅ LLM 看到的技能列表与实际可用技能一致
- ✅ 避免"安装了但用不了"的困惑

### 6.3 可观测性

- ✅ 安装日志与快照构建日志关联
- ✅ 会话记录包含技能安装历史
- ✅ 便于调试和问题排查

### 6.4 扩展性

- ✅ 易于添加新的关键词映射
- ✅ 支持多种技能源（CLI、npm、git）
- ✅ 可配置的确认机制

## 7. 潜在优化方向

### 7.1 智能意图识别

当前使用关键词匹配，可以升级为：

- **语义相似度**：使用 embedding 计算消息与技能描述的相似度
- **上下文感知**：考虑对话历史，不仅依赖当前消息
- **LLM 驱动**：让 LLM 直接判断需要什么技能

### 7.2 技能推荐

- **基于使用模式**：记录用户常用技能，优先推荐
- **技能组合**：识别经常一起使用的技能组合
- **白名单机制**：允许自动安装特定技能，无需确认

### 7.3 错误处理增强

- **安装失败重试**：网络问题自动重试
- **回滚机制**：如果新技能导致问题，可回滚到之前版本
- **依赖检查**：提前检查系统依赖，避免安装后才发现缺失

### 7.4 性能优化

- **异步安装**：不阻塞对话流程，后台安装
- **增量快照**：只更新变化的技能，而非全部重建
- **缓存策略**：缓存技能快照，减少重复扫描

## 8. 测试建议

### 8.1 单元测试

```typescript
// 测试自动安装触发时机
test("auto-skill-install triggers before skill snapshot", async () => {
  // 模拟用户消息包含技能关键词
  const message = "帮我查看 GitHub issue";
  // 验证：1. 自动安装被调用 2. 快照包含新技能
});

// 测试快照版本更新
test("skill snapshot version increments after install", async () => {
  // 安装新技能后，验证快照版本号增加
});
```

### 8.2 集成测试

```typescript
// 端到端测试
test("full flow: user request → auto-install → skill usage", async () => {
  // 1. 用户发送需要技能的消息
  // 2. 系统自动安装技能
  // 3. LLM 成功调用技能
  // 4. 返回正确结果
});
```

### 8.3 回归测试

- 确保现有功能不受影响
- 验证会话状态正确保存
- 检查日志输出符合预期

## 9. 总结

通过将自动技能安装从 `runEmbeddedPiAgent` 移动到 `runPreparedReply`（在 `ensureSkillSnapshot` 之前），我们实现了：

- ✅ **即时可用**：安装的技能立即在当前会话中可用
- ✅ **一致视图**：LLM 看到的技能列表与实际一致
- ✅ **无缝体验**：用户无需手动刷新或重启
- ✅ **易于维护**：逻辑集中，职责清晰

这个集成方案完美解决了原有时序问题，使得自动技能安装功能真正融入 OpenClaw 的协调机制，提供了流畅的用户体验。