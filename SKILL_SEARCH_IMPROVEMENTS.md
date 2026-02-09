# 技能搜索策略改进 - 利用 find-skills 技能

## 🎯 当前问题

1. **`npx skills find` 的局限性**：
   - 只能从 skills.sh 仓库搜索
   - 返回结果可能包含纯文档仓库（无 cmd.sh）
   - 无法获取技能质量指标（下载量、评分等）

2. **`find-skills` 技能的优势**：
   - 可能是更智能的搜索工具
   - 可能访问多个技能源
   - 可能提供质量评分和过滤

## 🔍 如何利用 find-skills 技能

### 方案 A：优先使用 find-skills（如果已安装）

```typescript
// 检查 find-skills 是否已安装
const findSkillsInstalled = await isSkillInstalled("find-skills", workspaceDir);

if (findSkillsInstalled) {
  // 使用 find-skills 技能搜索
  const results = await searchWithFindSkills(query);
  // 然后验证可执行性
  return await verifyAndSortResults(results);
}
```

### 方案 B：多源搜索融合

```typescript
// 1. 使用 npx skills find（现有方法）
const skillsShResults = await searchSkillsSh(query);

// 2. 如果 find-skills 已安装，使用它
const findSkillsResults = await searchWithFindSkills(query);

// 3. 合并去重，优先 find-skills 的结果
const mergedResults = mergeResults(findSkillsResults, skillsShResults);

// 4. 验证可执行性并排序
return await verifyAndSortResults(mergedResults);
```

### 方案 C：智能搜索策略

```typescript
async function smartSearchSkills(query: string): Promise<SkillSearchResult[]> {
  // 优先级 1: find-skills 技能（如果可用）
  if (await isSkillInstalled("find-skills", workspaceDir)) {
    const results = await invokeFindSkills(query);
    if (results.length > 0) {
      return await verifyAndSortResults(results);
    }
  }

  // 优先级 2: npx skills find
  const skillsShResults = await searchSkillsSh(query);
  if (skillsShResults.length > 0) {
    return await verifyAndSortResults(skillsShResults);
  }

  // 优先级 3: 直接 GitHub 搜索（备用）
  return await searchGitHubDirectly(query);
}
```

## 🛠️ 具体实现建议

### 1. 检查 find-skills 技能

```typescript
/**
 * 检查 find-skills 技能是否已安装并可用
 */
async function isFindSkillsAvailable(workspaceDir: string): Promise<boolean> {
  try {
    // 检查是否已安装
    const installed = await isSkillInstalled("find-skills", workspaceDir);
    if (!installed) return false;

    // 可选：测试技能是否响应
    // 这里可以添加一个简单的测试调用
    return true;
  } catch {
    return false;
  }
}
```

### 2. 调用 find-skills 技能

```typescript
/**
 * 使用 find-skills 技能搜索
 * 假设 find-skills 接受查询参数并返回技能列表
 */
async function searchWithFindSkills(query: string): Promise<SkillSearchResult[]> {
  try {
    // 这里需要根据 find-skills 技能的实际接口调整
    // 可能通过 WebChat 或直接调用技能
    const result = await runExec("npx", ["skills", "run", "find-skills", "--query", query], {
      timeoutMs: 30000,
    });

    // 解析 find-skills 的输出格式
    return parseFindSkillsOutput(result.stdout);
  } catch (error) {
    console.warn(`find-skills search failed:`, error);
    return [];
  }
}
```

### 3. 改进的 parseSkillsFindOutput

```typescript
/**
 * 解析 npx skills find 的输出（增强版）
 * 提取更多元数据：stars, updated, description quality
 */
function parseSkillsFindOutput(output: string): SkillSearchResult[] {
  const results: SkillSearchResult[] = [];
  const lines = output.split('\n');

  for (const line of lines) {
    // 原有格式：jimliu/baoyu-skills@baoyu-image-gen
    const match = line.match(/([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)@([a-zA-Z0-9_-]+)/);
    if (match) {
      const [full, repository, skillName] = match;
      
      // 尝试提取额外信息（如果输出包含）
      const qualityScore = extractQualityScore(line);
      const stars = extractStars(line);
      const description = extractDescription(line) || `Skill from ${repository}`;

      results.push({
        name: skillName,
        description,
        repository,
        homepage: `https://skills.sh/${repository}/${skillName}`,
        qualityScore,
        stars,
      });
    }
  }

  // 按质量排序（如果有质量分数）
  if (results.some(r => r.qualityScore !== undefined)) {
    results.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
  }

  return results;
}
```

### 4. 智能排序算法

```typescript
/**
 * 智能排序：综合多个因素
 */
function sortSkillResults(results: SkillSearchResult[]): SkillSearchResult[] {
  return results.sort((a, b) => {
    // 因素 1: 可执行性（最重要）
    const aHasExec = a.hasExecutable || false;
    const bHasExec = b.hasExecutable || false;
    if (aHasExec !== bHasExec) return bHasExec ? 1 : -1;

    // 因素 2: 质量评分
    const aScore = a.qualityScore || 0;
    const bScore = b.qualityScore || 0;
    if (aScore !== bScore) return bScore - aScore;

    // 因素 3: stars 数量
    const aStars = a.stars || 0;
    const bStars = b.stars || 0;
    if (aStars !== bStars) return bStars - aStars;

    // 因素 4: 名称匹配度
    const aNameMatch = a.name === currentSkillName ? 1 : 0;
    const bNameMatch = b.name === currentSkillName ? 1 : 0;
    if (aNameMatch !== bNameMatch) return bNameMatch - aNameMatch;

    return 0;
  });
}
```

## 📊 搜索策略优先级

### 第一优先级：find-skills 技能
- ✅ 如果已安装 `find-skills` 技能，优先使用它
- ✅ 它可能提供更准确、更全面的搜索结果
- ✅ 可能包含质量评分和过滤

### 第二优先级：npx skills find
- ✅ 从 skills.sh 搜索
- ✅ 验证可执行性
- ✅ 智能排序

### 第三优先级：手动部署
- ✅ 如果自动搜索都失败
- ✅ 提供手动部署指南

## 🔧 配置建议

在配置文件中启用智能搜索：

```json
{
  "skills": {
    "autoInstall": true,
    "searchStrategy": "smart", // "smart" | "find-skills" | "skills-sh" | "hybrid"
    "verifyExecutable": true,
    "fallbackToNextCandidate": true,
    "maxPerSession": 3
  }
}
```

## 🎯 实现步骤

1. **检测 find-skills 可用性**
2. **实现多源搜索融合**
3. **改进排序算法**
4. **添加缓存机制**
5. **提供配置选项**

## 📝 注意事项

- find-skills 技能的具体接口需要确认
- 可能需要处理不同的输出格式
- 确保向后兼容
- 添加适当的错误处理和降级策略

---

💡 **核心思想**：利用 `find-skills` 作为智能搜索前端，结合可执行性验证，提供更可靠的技能发现和安装体验。