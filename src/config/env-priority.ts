/**
 * Environment Variable Priority Configuration
 * 
 * This module ensures that environment variables take precedence over config file settings
 * for channel enablement. This addresses the issue where config file settings override
 * environment variables, causing the wrong channel to be selected.
 */

import type { OpenClawConfig } from "./types.js";

// Channel environment variable mappings - all supported channels
export const CHANNEL_ENV_VARS: Record<string, string> = {
  telegram: "TELEGRAM_ENABLED",
  discord: "DISCORD_ENABLED",
  slack: "SLACK_ENABLED",
  imessage: "IMESSAGE_ENABLED",
  whatsapp: "WHATSAPP_ENABLED",
  feishu: "FEISHU_ENABLED",
  dingtalk: "DINGTALK_ENABLED",
  wecom: "WECOM_ENABLED",
  line: "LINE_ENABLED",
};

/**
 * Apply environment variable priority to channel settings
 * This ensures that environment variables override config file settings
 */
export function applyEnvPriorityToChannels(config: OpenClawConfig, env: NodeJS.ProcessEnv): OpenClawConfig {
  const configWithPriority = { ...config };

  console.log(`[env-priority] applyEnvPriorityToChannels called`);
  console.log(`[env-priority] Initial config channels:`, JSON.stringify(configWithPriority.channels, null, 2));

  // Ensure channels section exists
  if (!configWithPriority.channels) {
    configWithPriority.channels = {};
  }

  // Apply environment variable priority to each channel
  Object.entries(CHANNEL_ENV_VARS).forEach(([channel, envVar]) => {
    const envValue = env[envVar];
    
    if (envValue !== undefined) {
      const shouldBeEnabled = envValue === "true" || envValue === "1";
      const currentEnabled = (configWithPriority.channels?.[channel] as any)?.enabled;
      
      console.log(`[env-priority] Channel ${channel}: env=${envValue}, current=${currentEnabled}, should=${shouldBeEnabled}`);
      
      // Override config file setting with environment variable
      if (currentEnabled !== shouldBeEnabled) {
        if (!configWithPriority.channels) {
          configWithPriority.channels = {};
        }
        (configWithPriority.channels as any)[channel] = {
          ...(configWithPriority.channels[channel] as any),
          enabled: shouldBeEnabled,
        };
        console.log(`[env-priority] Set ${channel}.enabled to ${shouldBeEnabled}`);
      }
    }
  });

  // Handle gateway trusted proxies
  const trustedProxiesEnv = env.GATEWAY_TRUSTED_PROXIES;
  if (trustedProxiesEnv !== undefined && trustedProxiesEnv.trim()) {
    const proxies = trustedProxiesEnv.split(',').map(p => p.trim()).filter(p => p);
    if (proxies.length > 0) {
      if (!configWithPriority.gateway) {
        configWithPriority.gateway = {};
      }
      configWithPriority.gateway.trustedProxies = proxies;
      console.log(`[env-priority] Set gateway.trustedProxies to: ${proxies.join(', ')}`);
    }
  }

  // Handle model configuration from environment variables
  const modelNameEnv = env.MODEL_NAME;
  if (modelNameEnv !== undefined && modelNameEnv.trim()) {
    if (!configWithPriority.agents) {
      configWithPriority.agents = {};
    }
    if (!configWithPriority.agents.defaults) {
      configWithPriority.agents.defaults = {};
    }
    const modelValue = modelNameEnv.trim();
    // Set model as object with primary field to match expected schema
    configWithPriority.agents.defaults.model = { primary: modelValue };
    console.log(`[env-priority] Set agents.defaults.model.primary to: ${modelValue}`);
  }

  console.log(`[env-priority] Final config channels:`, JSON.stringify(configWithPriority.channels, null, 2));
  console.log(`[env-priority] Final config gateway:`, JSON.stringify(configWithPriority.gateway, null, 2));
  console.log(`[env-priority] Final config agents:`, JSON.stringify(configWithPriority.agents, null, 2));

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
  const shouldApply = shouldApplyEnvPriority(env);
  console.log(`[env-priority] shouldApplyEnvPriority: ${shouldApply}`);
  console.log(`[env-priority] NODE_ENV: ${env.NODE_ENV}`);
  console.log(`[env-priority] RAILWAY_ENVIRONMENT: ${env.RAILWAY_ENVIRONMENT}`);
  console.log(`[env-priority] APPLY_ENV_PRIORITY: ${env.APPLY_ENV_PRIORITY}`);
  
  if (shouldApply) {
    console.log(`[env-priority] Applying environment variable priority in ${env.NODE_ENV || "unknown"} environment`);
    
    // Log gateway trusted proxies before applying
    if (env.GATEWAY_TRUSTED_PROXIES) {
      console.log(`[env-priority] GATEWAY_TRUSTED_PROXIES: ${env.GATEWAY_TRUSTED_PROXIES}`);
    }
    
    const result = applyEnvPriorityToChannels(config, env);
    
    // Log gateway trusted proxies after applying
    if (result.gateway?.trustedProxies) {
      console.log(`[env-priority] gateway.trustedProxies after applying: ${result.gateway.trustedProxies.join(', ')}`);
    } else {
      console.log(`[env-priority] gateway.trustedProxies not set in result`);
    }
    
    return result;
  }
  
  console.log(`[env-priority] Environment variable priority disabled in ${env.NODE_ENV || "unknown"} environment`);
  return config;
}