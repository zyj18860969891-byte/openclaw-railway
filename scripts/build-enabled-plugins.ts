#!/usr/bin/env tsx
/**
 * Build only the enabled channel plugins based on environment variables
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Channel plugin mapping
const CHANNEL_PLUGINS: Record<string, { pkgName: string; dir: string; enabledEnv: string }> = {
  feishu: {
    pkgName: '@openclaw/feishu',
    dir: 'extensions/feishu',
    enabledEnv: 'FEISHU_ENABLED'
  },
  dingtalk: {
    pkgName: '@openclaw/dingtalk',
    dir: 'extensions/dingtalk',
    enabledEnv: 'DINGTALK_ENABLED'
  },
  // Add other channels as needed
};

function isChannelEnabled(channel: string, pluginInfo: { dir: string; enabledEnv: string }): boolean {
  const envVar = process.env[pluginInfo.enabledEnv];
  if (envVar === 'true' || envVar === '1') {
    return true;
  }

  // Check config file
  try {
    const configPath = path.join(projectRoot, 'start.sh');
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const enabledPattern = new RegExp(`${channel}.*enabled.*true`, 'i');
      if (enabledPattern.test(configContent)) {
        return true;
      }
    }
  } catch (err) {
    // Ignore
  }

  return false;
}

function buildEnabledPlugins() {
  console.log('[build-plugins] Building enabled channel plugins...');

  const enabledPlugins = Object.entries(CHANNEL_PLUGINS).filter(([channel, pluginInfo]) =>
    isChannelEnabled(channel, pluginInfo)
  );

  if (enabledPlugins.length === 0) {
    console.log('[build-plugins] No channel plugins enabled');
    return;
  }

  for (const [channel, pluginInfo] of enabledPlugins) {
    console.log(`[build-plugins] Building ${channel} (${pluginInfo.pkgName})...`);
    try {
      execSync(`pnpm --filter ${pluginInfo.pkgName} build`, {
        cwd: projectRoot,
        stdio: 'inherit'
      });
      console.log(`[build-plugins] ✅ ${channel} built successfully`);
    } catch (error) {
      console.error(`[build-plugins] ❌ Failed to build ${channel}:`, error);
      // Don't exit - allow build to continue in case plugin is optional
    }
  }

  console.log(`[build-plugins] Complete: ${enabledPlugins.length} plugin(s) built`);
}

buildEnabledPlugins();