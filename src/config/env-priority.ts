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

  // Reduce logging - only log once per application startup
  const logOnce = (() => {
    let logged = false;
    return () => {
      if (!logged) {
        console.log(`[env-priority] Applying environment variable priority`);
        logged = true;
      }
    };
  })();

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
      
      // Override config file setting with environment variable
      if (currentEnabled !== shouldBeEnabled) {
        logOnce();
        if (!configWithPriority.channels) {
          configWithPriority.channels = {};
        }
        (configWithPriority.channels as any)[channel] = {
          ...(configWithPriority.channels[channel] as any),
          enabled: shouldBeEnabled,
        };
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
  }

  // Handle browser enabled/disabled from environment variable
  const browserEnabledEnv = env.OPENCLAW_BROWSER_ENABLED;
  if (browserEnabledEnv !== undefined) {
    const browserEnabled = browserEnabledEnv === "true" || browserEnabledEnv === "1";
    if (!configWithPriority.browser) {
      configWithPriority.browser = {};
    }
    configWithPriority.browser.enabled = browserEnabled;
  }

  // Handle browser executable path from environment variable
  const browserExecutableEnv = env.OPENCLAW_BROWSER_EXECUTABLE;
  if (browserExecutableEnv !== undefined && browserExecutableEnv.trim()) {
    if (!configWithPriority.browser) {
      configWithPriority.browser = {};
    }
    configWithPriority.browser.executablePath = browserExecutableEnv.trim();
  }

  // Handle browser headless mode from environment variable
  const browserHeadlessEnv = env.OPENCLAW_BROWSER_HEADLESS;
  if (browserHeadlessEnv !== undefined) {
    const headless = browserHeadlessEnv === "true" || browserHeadlessEnv === "1";
    if (!configWithPriority.browser) {
      configWithPriority.browser = {};
    }
    configWithPriority.browser.headless = headless;
  }

  // Handle browser no-sandbox mode from environment variable
  const browserNoSandboxEnv = env.OPENCLAW_BROWSER_NO_SANDBOX;
  if (browserNoSandboxEnv !== undefined) {
    const noSandbox = browserNoSandboxEnv === "true" || browserNoSandboxEnv === "1";
    if (!configWithPriority.browser) {
      configWithPriority.browser = {};
    }
    configWithPriority.browser.noSandbox = noSandbox;
  }

  // Handle skills auto-install from environment variable
  const skillsAutoInstallEnv = env.OPENCLAW_SKILLS_AUTO_INSTALL;
  if (skillsAutoInstallEnv !== undefined) {
    const autoInstall = skillsAutoInstallEnv === "true" || skillsAutoInstallEnv === "1";
    if (!configWithPriority.skills) {
      configWithPriority.skills = {};
    }
    configWithPriority.skills.autoInstall = autoInstall;
  }

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
  
  if (shouldApply) {
    // Only log once during startup
    if (!globalThis.__envPriorityApplied) {
      console.log(`[env-priority] Applying environment variable priority in production`);
      globalThis.__envPriorityApplied = true;
    }
    
    const result = applyEnvPriorityToChannels(config, env);
    
    return result;
  }
  
  return config;
}

// Global flag to track if env priority has been applied
declare global {
  var __envPriorityApplied: boolean | undefined;
}