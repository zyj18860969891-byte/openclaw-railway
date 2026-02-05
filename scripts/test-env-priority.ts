#!/usr/bin/env tsx
/**
 * Test Environment Variable Priority
 * 
 * This script tests that environment variables take precedence over config file settings
 * for channel enablement.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const configPath = path.join(projectRoot, 'moltbot.json');

// Test scenarios
const testScenarios = [
  {
    name: 'Feishu enabled via env, disabled in config',
    env: { FEISHU_ENABLED: 'true' },
    config: { channels: { feishu: { enabled: false } } },
    expected: { enabled: true },
    description: 'Environment variable should override config file'
  },
  {
    name: 'Feishu disabled via env, enabled in config',
    env: { FEISHU_ENABLED: 'false' },
    config: { channels: { feishu: { enabled: true } } },
    expected: { enabled: false },
    description: 'Environment variable should override config file'
  },
  {
    name: 'No environment variable, config enabled',
    env: {},
    config: { channels: { feishu: { enabled: true } } },
    expected: { enabled: true },
    description: 'Should use config file when no env var set'
  },
  {
    name: 'No environment variable, config disabled',
    env: {},
    config: { channels: { feishu: { enabled: false } } },
    expected: { enabled: false },
    description: 'Should use config file when no env var set'
  },
  {
    name: 'Multiple channels - Feishu enabled, Dingtalk disabled via env',
    env: { FEISHU_ENABLED: 'true', DINGTALK_ENABLED: 'false' },
    config: { 
      channels: { 
        feishu: { enabled: false }, 
        dingtalk: { enabled: true } 
      } 
    },
    expected: { feishu: { enabled: true }, dingtalk: { enabled: false } },
    description: 'Multiple channels should respect env vars'
  }
];

function backupConfig(): string {
  const backupPath = configPath + '.backup';
  fs.copyFileSync(configPath, backupPath);
  return backupPath;
}

function restoreConfig(backupPath: string): void {
  fs.copyFileSync(backupPath, configPath);
  fs.unlinkSync(backupPath);
}

function setConfig(config: any): void {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function testEnvPriority(): void {
  console.log('🧪 Testing Environment Variable Priority\n');
  
  let passed = 0;
  let failed = 0;
  
  testScenarios.forEach((scenario, index) => {
    console.log(`Test ${index + 1}: ${scenario.name}`);
    console.log(`Description: ${scenario.description}`);
    
    try {
      // Backup original config
      const backupPath = backupConfig();
      
      // Set test config
      setConfig(scenario.config);
      
      // Set environment variables
      const env = { ...process.env, ...scenario.env };
      
      // Run the test script
      const result = execSync(`node -e "
        const { loadConfig } = require('${projectRoot}/scripts/env-channel-priority.ts');
        const config = loadConfig();
        console.log(JSON.stringify(config.channels?.feishu || {}, null, 2));
      "`, { 
        env,
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const actual = JSON.parse(result.trim());
      const expected = scenario.expected.feishu || scenario.expected;
      
      // Check if result matches expectation
      const isPass = actual.enabled === expected.enabled;
      
      if (isPass) {
        console.log(`  ✅ PASS: Expected enabled=${expected.enabled}, got enabled=${actual.enabled}`);
        passed++;
      } else {
        console.log(`  ❌ FAIL: Expected enabled=${expected.enabled}, got enabled=${actual.enabled}`);
        failed++;
      }
      
      // Restore original config
      restoreConfig(backupPath);
      
    } catch (error) {
      console.log(`  ❌ ERROR: ${error}`);
      failed++;
      // Restore original config even on error
      try {
        restoreConfig(backupPath);
      } catch {}
    }
    
    console.log('');
  });
  
  console.log('📊 Test Results:');
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  🎯 Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Environment variable priority is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Environment variable priority may not be working correctly.');
  }
}

// Run the tests
testEnvPriority();