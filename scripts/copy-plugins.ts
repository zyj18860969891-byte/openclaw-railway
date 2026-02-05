#!/usr/bin/env tsx
/**
 * Copy channel plugins to dist/ based on environment variables
 * This ensures only the needed channel plugins are included in the build
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Channel plugin mapping: environment variable -> plugin name
// Supported channels: feishu, dingtalk, wecom, telegram, discord, slack, imessage, whatsapp, line, etc.
const CHANNEL_PLUGINS: Record<string, { dir: string; enabledEnv: string; pkgName?: string }> = {
  feishu: {
    dir: 'extensions/feishu',
    enabledEnv: 'FEISHU_ENABLED',
    pkgName: '@openclaw/feishu'
  },
  dingtalk: {
    dir: 'extensions/dingtalk',
    enabledEnv: 'DINGTALK_ENABLED',
    pkgName: '@openclaw/dingtalk'
  },
  wecom: {
    dir: 'extensions/wecom',
    enabledEnv: 'WECOM_ENABLED',
    pkgName: '@openclaw/wecom'
  },
  telegram: {
    dir: 'extensions/telegram',
    enabledEnv: 'TELEGRAM_ENABLED',
    pkgName: '@openclaw/telegram'
  },
  discord: {
    dir: 'extensions/discord',
    enabledEnv: 'DISCORD_ENABLED',
    pkgName: '@openclaw/discord'
  },
  slack: {
    dir: 'extensions/slack',
    enabledEnv: 'SLACK_ENABLED',
    pkgName: '@openclaw/slack'
  },
  imessage: {
    dir: 'extensions/imessage',
    enabledEnv: 'IMESSAGE_ENABLED',
    pkgName: '@openclaw/imessage'
  },
  whatsapp: {
    dir: 'extensions/whatsapp',
    enabledEnv: 'WHATSAPP_ENABLED',
    pkgName: '@openclaw/whatsapp'
  },
  line: {
    dir: 'extensions/line',
    enabledEnv: 'LINE_ENABLED',
    pkgName: '@openclaw/line'
  },
  // Add more channels as needed
};

function copyDir(src: string, dest: string) {
  if (!fs.existsSync(src)) {
    console.warn(`[copy-plugins] Source directory not found: ${src}`);
    return;
  }

  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function shouldCopyChannel(channel: string, pluginInfo: { dir: string; enabledEnv: string }): boolean {
  // 1. Check environment variable (highest priority)
  const envVar = process.env[pluginInfo.enabledEnv];
  if (envVar === 'true' || envVar === '1') {
    return true;
  }

  // 2. Check if plugin source exists (fallback)
  // If the plugin has been built, assume it should be copied
  const srcDir = path.join(projectRoot, pluginInfo.dir, 'dist');
  if (fs.existsSync(srcDir)) {
    // Plugin exists, check if it's explicitly disabled
    // If no environment variable and plugin exists, copy it
    if (!envVar || envVar === '') {
      return true;
    }
  }

  return false;
}

function copyPlugins() {
  console.log('[copy-plugins] Starting plugin copy based on environment variables...');

  const distChannelsDir = path.join(projectRoot, 'dist', 'channels');
  fs.mkdirSync(distChannelsDir, { recursive: true });

  let copiedCount = 0;
  let skippedCount = 0;

  for (const [channel, pluginInfo] of Object.entries(CHANNEL_PLUGINS)) {
    if (shouldCopyChannel(channel, pluginInfo)) {
      const srcDir = path.join(projectRoot, pluginInfo.dir, 'dist');
      const destDir = path.join(distChannelsDir, channel);

      if (fs.existsSync(srcDir)) {
        console.log(`[copy-plugins] Copying ${channel} plugin from ${srcDir} to ${destDir}`);
        copyDir(srcDir, destDir);
        copiedCount++;
      } else {
        console.warn(`[copy-plugins] Plugin source not found: ${srcDir}`);
      }
    } else {
      console.log(`[copy-plugins] Skipping ${channel} plugin (not enabled)`);
      skippedCount++;
    }
  }

  console.log(`[copy-plugins] Complete: ${copiedCount} plugin(s) copied, ${skippedCount} skipped`);
}

copyPlugins();