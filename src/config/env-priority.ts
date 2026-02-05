/**
 * Environment Variable Priority Configuration
 * 
 * This module ensures that environment variables take precedence over config file settings
 * for channel enablement. This addresses the issue where config file settings override
 * environment variables, causing the wrong channel to be selected.
 */

import type { OpenClawConfig } from "./types.js";

// Channel environment variable mappings
export const CHANNEL_ENV_VARS: Record<string, string> = {
  feishu: "FEISHU_ENABLED",
  dingtalk: "DINGTALK_ENABLED",
  qqbot: "QQ_BOT_ENABLED",
  wecom: "WECOM_ENABLED",
  telegram: "TELEGRAM_ENABLED",
  discord: "DISCORD_ENABLED",
  slack: "SLACK_ENABLED",
  imessage: "IMESSAGE_ENABLED",
  whatsapp: "WHATSAPP_ENABLED",
  line: "LINE_ENABLED",
};

/**
 * Apply environment variable priority to channel settings
 * This ensures that environment variables override config file settings
 */
export function applyEnvPriorityToChannels(config: OpenClawConfig, env: NodeJS.ProcessEnv): OpenClawConfig {
  const configWithPriority = { ...config };

  // Ensure channels section exists
  if (!configWithPriority.channels) {
    configWithPriority.channels = {};
  }

  // Apply environment variable priority to each channel
  Object.entries(CHANNEL_ENV_VARS).forEach(([channel, envVar]) => {
    const envValue = env[envVar];
    
    if (envValue !== undefined) {
      const shouldBeEnabled = envValue === "true" || envValue === "1";
      
      // Override config file setting with environment variable
      if (configWithPriority.channels[channel]?.enabled !== shouldBeEnabled) {
        configWithPriority.channels[channel] = {
          ...(configWithPriority.channels[channel] || {}),
          enabled: shouldBeEnabled,
        };
      }
    }
  });

  return configWithPriority;
}

/**
 * Check if environment variables should take priority
 * This is true in production environment or when explicitly enabled
 */
export function shouldApplyEnvPriority(env: NodeJS.ProcessEnv): boolean {
  return (
    env.NODE_ENV === "production" ||
    env.APPLY_ENV_PRIORITY === "true" ||
    env.RAILWAY_ENVIRONMENT === "production"
  );
}

/**
 * Apply environment variable priority if enabled
 */
export function applyEnvPriorityIfNeeded(config: OpenClawConfig, env: NodeJS.ProcessEnv): OpenClawConfig {
  if (shouldApplyEnvPriority(env)) {
    console.log(`[env-priority] Applying environment variable priority in ${env.NODE_ENV || "unknown"} environment`);
    return applyEnvPriorityToChannels(config, env);
  }
  
  console.log(`[env-priority] Environment variable priority disabled in ${env.NODE_ENV || "unknown"} environment`);
  return config;
}