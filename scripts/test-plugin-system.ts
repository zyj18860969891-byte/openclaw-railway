#!/usr/bin/env tsx
/**
 * Test script for the dynamic plugin build system
 * Run with: node --import tsx scripts/test-plugin-system.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Simulate environment variables for testing
const testScenarios = [
  { name: 'Feishu only', env: { FEISHU_ENABLED: 'true' } },
  { name: 'Dingtalk only', env: { DINGTALK_ENABLED: 'true' } },
  { name: 'Both Feishu and Dingtalk', env: { FEISHU_ENABLED: 'true', DINGTALK_ENABLED: 'true' } },
  { name: 'None enabled', env: {} },
];

console.log('🧪 Testing dynamic plugin build system\n');

for (const scenario of testScenarios) {
  console.log(`\n📋 Scenario: ${scenario.name}`);
  console.log(`   Environment: ${JSON.stringify(scenario.env)}`);

  // Set test environment
  for (const [key, value] of Object.entries(scenario.env)) {
    process.env[key] = value;
  }

  // Check which plugins would be copied
  const CHANNEL_PLUGINS = {
    feishu: { dir: 'extensions/feishu', enabledEnv: 'FEISHU_ENABLED' },
    dingtalk: { dir: 'extensions/dingtalk', enabledEnv: 'DINGTALK_ENABLED' },
  };

  const wouldCopy: string[] = [];
  for (const [channel, pluginInfo] of Object.entries(CHANNEL_PLUGINS)) {
    const envVar = process.env[pluginInfo.enabledEnv];
    const enabled = envVar === 'true' || envVar === '1';
    if (enabled) {
      wouldCopy.push(channel);
    }
  }

  console.log(`   Would copy plugins: ${wouldCopy.length > 0 ? wouldCopy.join(', ') : 'none'}`);

  // Clean up test env
  for (const key of Object.keys(scenario.env)) {
    delete process.env[key];
  }
}

console.log('\n✅ Test complete');