import type { OpenClawConfig } from "../config/config.js";
import { loadWorkspaceSkillEntries } from "./skills.js";
import { runExec } from "../process/exec.js";
import { bumpSkillsSnapshotVersion } from "./skills/refresh.js";

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
}

export function getAutoInstallConfig(config: OpenClawConfig): AutoSkillInstallConfig {
  // 从环境变量读取自动安装配置
  const envAutoInstall = process.env.OPENCLAW_SKILLS_AUTO_INSTALL;
  const envRequireConfirmation = process.env.OPENCLAW_SKILLS_REQUIRE_CONFIRMATION;
  const envMaxSkills = process.env.OPENCLAW_SKILLS_MAX_PER_SESSION;
  
  const enabled = envAutoInstall ? envAutoInstall === 'true' || envAutoInstall === '1' : false;
  const requireUserConfirmation = envRequireConfirmation ? envRequireConfirmation === 'true' || envRequireConfirmation === '1' : true;
  const maxSkillsPerSession = envMaxSkills ? parseInt(envMaxSkills, 10) : 3;
  
  return {
    enabled,
    requireUserConfirmation,
    maxSkillsPerSession: isNaN(maxSkillsPerSession) ? 3 : maxSkillsPerSession,
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
 * 从 skills.sh 搜索技能
 */
export async function searchSkills(query: string): Promise<SkillSearchResult[]> {
  try {
    // 使用 npx skills find 命令搜索
    const { stdout, stderr } = await runExec("npx", ["skills", "find", query], {
      timeoutMs: 30000,
    });

    if (stderr && stderr.includes("error")) {
      console.error(`Skills search failed: ${stderr}`);
      return [];
    }

    // 解析搜索结果
    return parseSkillsFindOutput(stdout);
  } catch (error) {
    console.error(`Error searching skills: ${error}`);
    return [];
  }
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
 * 检查技能是否已安装
 */
export async function isSkillInstalled(skillName: string, workspaceDir: string): Promise<boolean> {
  try {
    const entries = loadWorkspaceSkillEntries(workspaceDir, { config: undefined });
    return entries.some(entry => entry.skill.name === skillName);
  } catch (error) {
    console.error(`Error checking skill installation: ${error}`);
    return false;
  }
}

/**
 * 安装技能
 */
export async function installSkill(
  skillName: string,
  repository: string,
  workspaceDir: string,
  config: OpenClawConfig
): Promise<{ success: boolean; message: string }> {
  try {
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
      // 触发技能版本更新，确保快照重新构建
      bumpSkillsSnapshotVersion({ workspaceDir, reason: "manual" });
      return {
        success: true,
        message: `Successfully installed skill: ${skillName}`,
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
 * 处理消息中的技能需求
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
        skipped.push(`${skillName} (already installed)`);
        continue;
      }

      // 搜索技能
      const searchResults = await searchSkills(skillName);
      const bestMatch = searchResults.find(r => r.name === skillName) || searchResults[0];

      if (!bestMatch) {
        errors.push(`No skill found for: ${skillName}`);
        continue;
      }

      // 用户确认
      if (autoInstallConfig.requireUserConfirmation && userConfirmation) {
        const confirmed = await userConfirmation(bestMatch);
        if (!confirmed) {
          skipped.push(`${skillName} (user declined)`);
          continue;
        }
      }

      // 安装技能
      const result = await installSkill(skillName, bestMatch.repository, workspaceDir, config);
      if (result.success) {
        installed.push(skillName);
      } else {
        errors.push(result.message);
      }
    } catch (error) {
      errors.push(`Error processing ${skillName}: ${String(error)}`);
    }
  }

  return { installed, skipped, errors };
}