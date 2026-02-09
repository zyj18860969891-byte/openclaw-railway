import type { OpenClawConfig } from "../config/config.js";
import { loadWorkspaceSkillEntries } from "./skills.js";
import { runExec } from "../process/exec.js";
import { bumpSkillsSnapshotVersion } from "./skills/refresh.js";
import * as fs from "node:fs";
import * as path from "node:path";
import { tmpdir } from "node:os";

export interface SkillSearchResult {
  name: string;
  description: string;
  repository: string;
  homepage?: string;
}

export interface AutoSkillInstallConfig {
  enabled: boolean;
  requireUserConfirmation: boolean;
  maxSkillsPerSession: number;
  verifyExecutable?: boolean; // 是否验证技能可执行性
  fallbackToNextCandidate?: boolean; // 安装失败时是否尝试下一个候选
}

export function getAutoInstallConfig(config: OpenClawConfig): AutoSkillInstallConfig {
  // 从配置文件读取（现在类型已经包含这些属性）
  const skillsConfig = config.skills;
  
  const enabled = skillsConfig?.autoInstall ?? false;
  const requireUserConfirmation = skillsConfig?.requireUserConfirmation ?? true;
  const maxSkillsPerSession = skillsConfig?.maxPerSession ?? 3;
  const verifyExecutable = skillsConfig?.verifyExecutable ?? true;
  const fallbackToNextCandidate = skillsConfig?.fallbackToNextCandidate ?? true;
  
  return {
    enabled,
    requireUserConfirmation,
    maxSkillsPerSession,
    verifyExecutable,
    fallbackToNextCandidate,
  };
}

/**
 * 分析用户消息，检测是否需要新技能
 */
export function detectSkillNeeds(message: string): string[] {
  const skillKeywords: Record<string, string[]> = {
    "image-gen": ["图片", "图像", "生成图片", "文生图", "draw", "image", "picture", "photo", "generate image", "create image"],
    "weather": ["天气", "weather", "forecast", "温度", "降雨", "气候"],
    "github": ["github", "仓库", "repository", "代码", "commit", "pull request"],
    "notion": ["notion", "笔记", "笔记软件", "document"],
    "openai-image-gen": ["dalle", "dall-e", "openai 图片", "GPT 图片"],
    "gemini": ["gemini", "google ai", "google 助手"],
  };

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

/**
 * 检查技能仓库是否包含可执行文件
 */
async function checkSkillExecutable(repository: string): Promise<boolean> {
  try {
    // 创建临时目录来克隆仓库
    const tempDir = path.join(tmpdir(), `skill-check-${Date.now()}`);
    await fs.promises.mkdir(tempDir, { recursive: true });
    
    // 克隆仓库（浅克隆，只获取必要文件）
    await runExec("git", ["clone", "--depth", "1", `https://github.com/${repository}.git`, tempDir], {
      timeoutMs: 30000,
    });
    
    // 检查是否存在 cmd.sh 或 cmd.bat
    const possibleExecutables = [
      path.join(tempDir, "cmd.sh"),
      path.join(tempDir, "cmd.bat"),
      path.join(tempDir, "run.sh"),
      path.join(tempDir, "start.sh"),
    ];
    
    for (const execPath of possibleExecutables) {
      if (fs.existsSync(execPath)) {
        // 检查文件是否可执行（非空）
        const stats = fs.statSync(execPath);
        if (stats.size > 0) {
          // 清理临时目录
          try {
            await fs.promises.rm(tempDir, { recursive: true, force: true });
          } catch {
            // 忽略清理错误
          }
          return true;
        }
      }
    }
    
    // 清理临时目录
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch {
      // 忽略清理错误
    }
    
    return false;
  } catch (error) {
    console.warn(`Failed to check executable for ${repository}:`, error);
    return false;
  }
}

/**
 * 检查 find-skills 技能是否可用
 */
async function isFindSkillsAvailable(workspaceDir: string): Promise<boolean> {
  try {
    // 检查 find-skills 是否已安装
    const installed = await isSkillInstalled("find-skills", workspaceDir);
    return installed;
  } catch {
    return false;
  }
}

/**
 * 使用 find-skills 技能搜索（如果可用）
 */
async function searchWithFindSkills(query: string, workspaceDir: string): Promise<SkillSearchResult[]> {
  try {
    console.log(`🔍 Using find-skills skill to search for: ${query}`);
    
    // 调用 find-skills 技能
    // 注意：这里需要根据 find-skills 的实际接口调整
    // 假设 find-skills 接受查询参数并返回技能列表
    const { stdout, stderr } = await runExec("npx", [
      "skills", "run", "find-skills", 
      "--query", query,
      "--format", "json"  // 假设支持 JSON 输出
    ], {
      timeoutMs: 30000,
    });

    if (stderr && stderr.includes("error")) {
      console.warn(`find-skills search failed: ${stderr}`);
      return [];
    }

    // 解析 find-skills 的输出
    return parseFindSkillsOutput(stdout);
  } catch (error) {
    console.warn(`find-skills search error:`, error);
    return [];
  }
}

/**
 * 解析 find-skills 的输出（JSON 格式）
 */
function parseFindSkillsOutput(output: string): SkillSearchResult[] {
  try {
    const data = JSON.parse(output);
    if (Array.isArray(data)) {
      return data.map(item => ({
        name: item.name || item.skillName,
        description: item.description || `Skill from ${item.repository}`,
        repository: item.repository,
        homepage: item.homepage || `https://github.com/${item.repository}`,
        qualityScore: item.qualityScore || item.score,
        stars: item.stars,
      }));
    }
  } catch {
    // 如果不是 JSON，尝试解析为文本格式
  }
  
  // 回退到文本解析
  const results: SkillSearchResult[] = [];
  const lines = output.split('\n');

  for (const line of lines) {
    // 匹配类似：jimliu/baoyu-skills@baoyu-image-gen (quality: 0.8, stars: 100)
    const match = line.match(/([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)@([a-zA-Z0-9_-]+)(?:\s*\(quality:\s*([\d.]+)(?:,\s*stars:\s*(\d+))?)?/);
    if (match) {
      const [full, repository, skillName, qualityScore, stars] = match;
      results.push({
        name: skillName,
        description: `Skill from ${repository}`,
        repository,
        homepage: `https://skills.sh/${repository}/${skillName}`,
        qualityScore: qualityScore ? parseFloat(qualityScore) : undefined,
        stars: stars ? parseInt(stars, 10) : undefined,
      });
    }
  }

  return results;
}

/**
 * 智能搜索策略：优先使用 find-skills，回退到 npx skills find
 */
export async function searchSkills(
  query: string, 
  verifyExecutable: boolean = true,
  workspaceDir?: string
): Promise<SkillSearchResult[]> {
  try {
    let results: SkillSearchResult[] = [];
    
    // 策略 1: 如果 find-skills 可用且提供了 workspaceDir，优先使用
    if (workspaceDir && verifyExecutable) {
      const findSkillsAvailable = await isFindSkillsAvailable(workspaceDir);
      if (findSkillsAvailable) {
        results = await searchWithFindSkills(query, workspaceDir);
        if (results.length > 0) {
          console.log(`✅ find-skills returned ${results.length} results`);
          // find-skills 可能已经过滤过，但仍需验证可执行性
          if (verifyExecutable) {
            return await verifyAndSortResults(results);
          }
          return results;
        }
      }
    }

    // 策略 2: 使用 npx skills find（传统方法）
    console.log(`🔍 Using npx skills find for: ${query}`);
    try {
      const { stdout, stderr } = await runExec("npx", ["skills", "find", query], {
        timeoutMs: 30000,
      });

      if (stderr && stderr.includes("error")) {
        console.warn(`Skills search failed: ${stderr}, trying fallback...`);
        // 尝试回退策略
        results = await searchWithFallback(query);
      } else {
        // 解析搜索结果
        results = parseSkillsFindOutput(stdout);
        console.log(`🔍 Found ${results.length} skills for query: ${query}`);
      }
      
    } catch (searchError) {
      console.warn(`Skills search command failed: ${searchError}, trying fallback...`);
      // 回退策略
      results = await searchWithFallback(query);
    }
    
    // 如果需要验证可执行性，异步检查并排序
    if (verifyExecutable && results.length > 1) {
      return await verifyAndSortResults(results);
    }
    
    return results;
  } catch (error) {
    console.error(`Error searching skills: ${error}`);
    return [];
  }
}

/**
 * 回退搜索策略：使用内置的常用技能数据库
 */
async function searchWithFallback(query: string): Promise<SkillSearchResult[]> {
  console.log(`🔄 Using fallback search for: ${query}`);
  
  // 常用技能映射表
  const commonSkills: Record<string, SkillSearchResult[]> = {
    weather: [
      {
        name: "weather",
        description: "天气查询技能",
        repository: "jimliu/baoyu-skills",
        homepage: "https://skills.sh/jimliu/baoyu-skills/weather",
      }
    ],
    time: [
      {
        name: "time",
        description: "时间查询技能",
        repository: "jimliu/baoyu-skills",
        homepage: "https://skills.sh/jimliu/baoyu-skills/time",
      }
    ],
    translate: [
      {
        name: "translate",
        description: "翻译技能",
        repository: "jimliu/baoyu-skills",
        homepage: "https://skills.sh/jimliu/baoyu-skills/translate",
      }
    ],
    calculator: [
      {
        name: "calculator",
        description: "计算器技能",
        repository: "jimliu/baoyu-skills",
        homepage: "https://skills.sh/jimliu/baoyu-skills/calculator",
      }
    ],
    image: [
      {
        name: "image-gen",
        description: "图像生成技能",
        repository: "jimliu/baoyu-skills",
        homepage: "https://skills.sh/jimliu/baoyu-skills/image-gen",
      }
    ]
  };
  
  // 查找匹配的技能
  const queryLower = query.toLowerCase();
  const matchedSkills: SkillSearchResult[] = [];
  
  // 精确匹配
  if (commonSkills[queryLower]) {
    matchedSkills.push(...commonSkills[queryLower]);
  }
  
  // 模糊匹配
  for (const [key, skills] of Object.entries(commonSkills)) {
    if (key.includes(queryLower) || queryLower.includes(key)) {
      matchedSkills.push(...skills);
    }
  }
  
  // 去重
  const uniqueSkills = matchedSkills.filter((skill, index, self) => 
    index === self.findIndex(s => s.name === skill.name)
  );
  
  console.log(`🔄 Fallback search found ${uniqueSkills.length} skills for: ${query}`);
  return uniqueSkills;
}

/**
 * 验证并排序搜索结果
 */
async function verifyAndSortResults(results: SkillSearchResult[]): Promise<SkillSearchResult[]> {
  if (results.length <= 1) return results;

  console.log(`🔍 Verifying executability for ${results.length} skill candidates...`);
  
  const verifiedResults = await Promise.all(
    results.map(async (result) => {
      try {
        const hasExecutable = await checkSkillExecutable(result.repository);
        return {
          ...result,
          hasExecutable,
        };
      } catch {
        return {
          ...result,
          hasExecutable: false,
        };
      }
    })
  );
  
  // 智能排序：综合多个因素
  verifiedResults.sort((a, b) => {
    // 因素 1: 可执行性（最重要）
    if (a.hasExecutable && !b.hasExecutable) return -1;
    if (!a.hasExecutable && b.hasExecutable) return 1;
    
    // 因素 2: 质量评分（如果可用）
    const aScore = a.qualityScore || 0;
    const bScore = b.qualityScore || 0;
    if (aScore !== bScore) return bScore - aScore;
    
    // 因素 3: stars 数量（如果可用）
    const aStars = a.stars || 0;
    const bStars = b.stars || 0;
    if (aStars !== bStars) return bStars - aStars;
    
    return 0;
  });
  
  const executableCount = verifiedResults.filter(r => r.hasExecutable).length;
  console.log(`✅ Verified: ${executableCount}/${verifiedResults.length} have executables`);
  
  // 返回排序后的结果（不包含标记字段）
  return verifiedResults.map(({ hasExecutable, ...rest }) => rest);
}

/**
 * 解析 npx skills find 的输出
 */
function parseSkillsFindOutput(output: string): SkillSearchResult[] {
  const results: SkillSearchResult[] = [];
  const lines = output.split('\n');

  for (const line of lines) {
    // 匹配类似：jimliu/baoyu-skills@baoyu-image-gen
    const match = line.match(/([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)@([a-zA-Z0-9_-]+)/);
    if (match) {
      const [full, repository, skillName] = match;
      results.push({
        name: skillName,
        description: `Skill from ${repository}`,
        repository,
        homepage: `https://skills.sh/${repository}/${skillName}`,
      });
    }
  }

  return results;
}

/**
 * 检查技能是否已安装且真正可用（有可执行文件）
 */
export async function isSkillInstalled(skillName: string, workspaceDir: string): Promise<boolean> {
  try {
    const entries = loadWorkspaceSkillEntries(workspaceDir, { config: undefined });
    const skillEntry = entries.find(entry => entry.skill.name === skillName);
    
    if (!skillEntry) {
      return false;
    }
    
    // 检查技能目录中是否有可执行文件
    const skillDir = skillEntry.path;
    const possibleExecutables = [
      path.join(skillDir, "cmd.sh"),
      path.join(skillDir, "cmd.bat"),
      path.join(skillDir, "run.sh"),
      path.join(skillDir, "start.sh"),
    ];
    
    for (const execPath of possibleExecutables) {
      if (fs.existsSync(execPath)) {
        const stats = fs.statSync(execPath);
        if (stats.size > 0) {
          return true;
        }
      }
    }
    
    // 技能目录存在但没有可执行文件，视为未安装
    console.warn(`Skill ${skillName} exists but has no executable file`);
    return false;
  } catch (error) {
    console.error(`Error checking skill installation: ${error}`);
    return false;
  }
}

/**
 * 验证已安装的技能是否真正可用（检查是否有 cmd.sh）
 */
async function verifyInstalledSkill(skillName: string, workspaceDir: string): Promise<boolean> {
  try {
    const entries = loadWorkspaceSkillEntries(workspaceDir, { config: undefined });
    const skillEntry = entries.find(entry => entry.skill.name === skillName);
    
    if (!skillEntry) {
      return false;
    }
    
    // 检查技能目录中是否有 cmd.sh 或 cmd.bat
    const skillDir = skillEntry.path;
    const possibleExecutables = [
      path.join(skillDir, "cmd.sh"),
      path.join(skillDir, "cmd.bat"),
      path.join(skillDir, "run.sh"),
      path.join(skillDir, "start.sh"),
    ];
    
    for (const execPath of possibleExecutables) {
      if (fs.existsSync(execPath)) {
        const stats = fs.statSync(execPath);
        if (stats.size > 0) {
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.warn(`Error verifying skill ${skillName}:`, error);
    return false;
  }
}

/**
 * 安装技能（增强版）
 */
export async function installSkill(
  skillName: string,
  repository: string,
  workspaceDir: string,
  config: OpenClawConfig,
  verifyAfterInstall?: boolean
): Promise<{ success: boolean; message: string; hasExecutable?: boolean }> {
  try {
    console.log(`📦 Installing skill: ${skillName} from ${repository}`);
    
    // 使用 npx skills add 安装
    const { stdout, stderr } = await runExec("npx", ["skills", "add", repository], {
      timeoutMs: 120000, // 2分钟超时
    });

    // 检查输出中是否包含成功信息
    const success = stdout.includes("successfully installed") || 
                   stdout.includes("Installed") ||
                   stderr.includes("successfully installed") ||
                   stderr.includes("Installed");

    if (success) {
      // 如果需要验证，检查技能是否真正可用
      let hasExecutable = true;
      if (verifyAfterInstall !== false) {
        hasExecutable = await verifyInstalledSkill(skillName, workspaceDir);
        if (!hasExecutable) {
          console.warn(`⚠️ Skill ${skillName} installed but no executable found`);
        }
      }
      
      // 触发技能版本更新，确保快照重新构建
      bumpSkillsSnapshotVersion({ workspaceDir, reason: "manual" });
      
      return {
        success: true,
        message: `Successfully installed skill: ${skillName}`,
        hasExecutable,
      };
    } else {
      return {
        success: false,
        message: `Failed to install skill: ${stderr || stdout}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Installation error: ${String(error)}`,
    };
  }
}

/**
 * 处理消息中的技能需求（增强版）
 */
export async function processSkillNeeds(
  message: string,
  workspaceDir: string,
  config: OpenClawConfig,
  userConfirmation?: (skill: SkillSearchResult) => Promise<boolean>
): Promise<{ installed: string[]; skipped: string[]; errors: string[] }> {
  const autoInstallConfig = getAutoInstallConfig(config);
  
  if (!autoInstallConfig.enabled) {
    return { installed: [], skipped: [], errors: [] };
  }

  const neededSkills = detectSkillNeeds(message);
  const installed: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];

  for (const skillName of neededSkills.slice(0, autoInstallConfig.maxSkillsPerSession)) {
    try {
      // 检查是否已安装
      if (await isSkillInstalled(skillName, workspaceDir)) {
        console.log(`✅ Skill already installed: ${skillName}`);
        skipped.push(`${skillName} (already installed)`);
        continue;
      }

      // 搜索技能（启用可执行性验证，传递 workspaceDir 以使用 find-skills）
      const searchResults = await searchSkills(skillName, autoInstallConfig.verifyExecutable, workspaceDir);
      
      if (searchResults.length === 0) {
        console.warn(`⚠️ No skill found for: ${skillName}`);
        errors.push(`No skill found for: ${skillName}`);
        continue;
      }
      
      console.log(`🔍 Found ${searchResults.length} candidates for skill: ${skillName}`);

      // 尝试安装候选技能，直到成功或耗尽候选
      let installedSuccessfully = false;
      const attemptedRepositories: string[] = [];
      
      for (const candidate of searchResults) {
        attemptedRepositories.push(candidate.repository);
        
        // 用户确认（仅对第一个候选）
        if (autoInstallConfig.requireUserConfirmation && userConfirmation && attemptedRepositories.length === 1) {
          const confirmed = await userConfirmation(candidate);
          if (!confirmed) {
            skipped.push(`${skillName} (user declined)`);
            break;
          }
        }

        console.log(`🔄 Attempting to install ${skillName} from ${candidate.repository}`);
        
        // 安装技能（启用安装后验证）
        const result = await installSkill(skillName, candidate.repository, workspaceDir, config, true);
        
        if (result.success) {
          if (result.hasExecutable) {
            installed.push(skillName);
            installedSuccessfully = true;
            console.log(`✅ Successfully installed ${skillName} with executable`);
            break;
          } else {
            console.warn(`⚠️ Installed ${skillName} but no executable found, trying next candidate...`);
            // 继续尝试下一个候选
          }
        } else {
          console.warn(`❌ Failed to install from ${candidate.repository}: ${result.message}`);
          // 继续尝试下一个候选
        }
      }
      
      if (!installedSuccessfully) {
        errors.push(`Failed to install ${skillName} from any candidate: ${attemptedRepositories.join(", ")}`);
      }
      
    } catch (error) {
      errors.push(`Error processing ${skillName}: ${String(error)}`);
    }
  }

  return { installed, skipped, errors };
}