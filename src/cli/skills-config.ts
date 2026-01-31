import type { OpenClawConfig } from "../config/config.js";

export interface SkillSource {
  type: "cli" | "npm" | "git";
  command?: string;
  registry?: string;
  enabled?: boolean;
}

export interface SkillsConfig {
  enabled: boolean;
  autoInstall?: boolean;
  sources: SkillSource[];
  installPath?: string;
}

export function getDefaultSkillsConfig(): SkillsConfig {
  return {
    enabled: true,
    autoInstall: false,
    sources: [
      {
        type: "cli",
        command: "npx skills add",
        registry: "https://skills.sh",
        enabled: true,
      },
    ],
    installPath: "~/.openclaw/skills",
  };
}

export function getSkillsConfig(config: OpenClawConfig): SkillsConfig {
  return (config.skills as SkillsConfig) ?? getDefaultSkillsConfig();
}

export function isSkillsEnabled(config: OpenClawConfig): boolean {
  return getSkillsConfig(config).enabled;
}

export function getEnabledSkillSources(config: OpenClawConfig): SkillSource[] {
  const skillsConfig = getSkillsConfig(config);
  return skillsConfig.sources.filter(source => source.enabled !== false);
}

export function findSkillSource(config: OpenClawConfig, type: string): SkillSource | null {
  const sources = getEnabledSkillSources(config);
  return sources.find(source => source.type === type) || null;
}