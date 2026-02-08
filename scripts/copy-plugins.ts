#!/usr/bin/env tsx
/**
 * Copy channel plugins to dist/ based on environment variables
 * This ensures only the needed channel plugins are included in the build
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
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

  // Also copy to workspace .openclaw/extensions for plugin discovery
  const workspaceDir = process.env.OPENCLAW_WORKSPACE_DIR || '/tmp/workspace';
  // Ensure we use forward slashes for Linux compatibility in Docker
  const workspaceExtensionsDir = path.posix.join(workspaceDir, '.openclaw', 'extensions');
  fs.mkdirSync(workspaceExtensionsDir, { recursive: true });

  let copiedCount = 0;
  let skippedCount = 0;

  for (const [channel, pluginInfo] of Object.entries(CHANNEL_PLUGINS)) {
    const isEnabled = shouldCopyChannel(channel, pluginInfo);
    const srcDir = path.join(projectRoot, pluginInfo.dir, 'dist');
    const distDestDir = path.join(distChannelsDir, channel);
    const workspaceDestDir = path.join(workspaceExtensionsDir, channel);

    if (isEnabled) {
      if (fs.existsSync(srcDir)) {
        console.log(`[copy-plugins] Copying ${channel} plugin from ${srcDir} to ${distDestDir}`);
        copyDir(srcDir, distDestDir);
        // Also copy to workspace directory
        console.log(`[copy-plugins] Copying ${channel} plugin to workspace: ${workspaceDestDir}`);
        copyDir(srcDir, workspaceDestDir);
        copiedCount++;
      } else {
        console.warn(`[copy-plugins] Plugin source not found: ${srcDir}`);
      }
    }

    // Always copy plugin manifest files from extension root directory
    // This ensures all plugins are discoverable by OpenClaw even if not enabled
    const pluginManifests = ['openclaw.plugin.json', 'moltbot.plugin.json', 'clawdbot.plugin.json'];
    const srcRootDir = path.join(projectRoot, pluginInfo.dir);

    let manifestCopied = false;
    for (const manifest of pluginManifests) {
      const srcManifest = path.join(srcRootDir, manifest);
      if (fs.existsSync(srcManifest)) {
        // Copy to dist directory
        const distManifest = path.join(distDestDir, manifest);
        // Copy to workspace directory
        const workspaceManifest = path.join(workspaceDestDir, manifest);
        if (!manifestCopied) {
          // Only create directories and log once if we're copying any manifest
          fs.mkdirSync(distDestDir, { recursive: true });
          fs.mkdirSync(workspaceDestDir, { recursive: true });
          if (isEnabled) {
            console.log(`[copy-plugins] Copying plugin manifests for ${channel} to dist and workspace`);
          } else {
            console.log(`[copy-plugins] Copying plugin manifests for ${channel} (disabled but available)`);
          }
          manifestCopied = true;
        }
        fs.copyFileSync(srcManifest, distManifest);
        fs.copyFileSync(srcManifest, workspaceManifest);
      }
    }

    if (isEnabled) {
      console.log(`[copy-plugins] ✅ ${channel} plugin processed (enabled)`);
    } else {
      console.log(`[copy-plugins] ⏸️  ${channel} plugin processed (disabled but manifests available)`);
      skippedCount++;
    }
  }

  console.log(`[copy-plugins] Complete: ${copiedCount} plugin(s) fully copied, ${skippedCount} disabled but available`);
}

copyPlugins();