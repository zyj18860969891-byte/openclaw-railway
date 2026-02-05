#!/usr/bin/env tsx
/**
 * Environment Variable Channel Priority Script
 * 
 * This script ensures that environment variables take precedence over config file settings
 * for channel enablement. This addresses the issue where config file settings override
 * environment variables, causing the wrong channel to be selected.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const configPath = path.join(projectRoot, 'moltbot.json');

// Channel environment variable mappings
const CHANNEL_ENV_VARS: Record<string, string> = {
  feishu: 'FEISHU_ENABLED',
  dingtalk: 'DINGTALK_ENABLED',
  qqbot: 'QQ_BOT_ENABLED',
  // Add other channels as needed
};

function loadConfig(): any {
  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(configContent);
  } catch (error) {
    console.error('Error loading config:', error);
    return {};
  }
}

function saveConfig(config: any): void {
  try {
    const configContent = JSON.stringify(config, null, 2);
    fs.writeFileSync(configPath, configContent, 'utf8');
    console.log('✅ Config updated successfully');
  } catch (error) {
    console.error('Error saving config:', error);
  }
}

function applyEnvPriorityToConfig(): void {
  console.log('[env-priority] Applying environment variable priority to config...');
  
  const config = loadConfig();
  let hasChanges = false;

  // Apply environment variable priority to channels
  Object.entries(CHANNEL_ENV_VARS).forEach(([channel, envVar]) => {
    const envValue = process.env[envVar];
    
    if (envValue !== undefined) {
      console.log(`[env-priority] ${channel}: ${envVar}=${envValue}`);
      
      // Ensure channels section exists
      if (!config.channels) {
        config.channels = {};
      }
      
      // Set channel enabled based on environment variable
      const shouldBeEnabled = envValue === 'true' || envValue === '1';
      
      if (config.channels[channel]?.enabled !== shouldBeEnabled) {
        console.log(`[env-priority] ${channel}: Setting enabled=${shouldBeEnabled} (was ${config.channels[channel]?.enabled})`);
        config.channels[channel] = {
          ...config.channels[channel],
          enabled: shouldBeEnabled
        };
        hasChanges = true;
      }
    } else {
      console.log(`[env-priority] ${channel}: ${envVar} not set, using config value`);
    }
  });

  if (hasChanges) {
    console.log('[env-priority] Config changes detected, saving...');
    saveConfig(config);
  } else {
    console.log('[env-priority] No changes needed');
  }
}

// Check if environment variables should override config
const shouldApplyPriority = process.env.APPLY_ENV_PRIORITY === 'true' || 
                           process.env.NODE_ENV === 'production';

if (shouldApplyPriority) {
  console.log('[env-priority] Environment variable priority enabled');
  applyEnvPriorityToConfig();
} else {
  console.log('[env-priority] Environment variable priority disabled');
  console.log('[env-priority] Set APPLY_ENV_PRIORITY=true to enable');
}

export { applyEnvPriorityToConfig, CHANNEL_ENV_VARS, loadConfig, saveConfig };