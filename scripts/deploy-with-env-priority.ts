#!/usr/bin/env tsx
/**
 * Deploy with Environment Variable Priority
 * 
 * This script ensures that environment variables take precedence over config file settings
 * when deploying to Railway or other platforms.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

console.log('🚀 Deploying with Environment Variable Priority\n');

// Step 1: Check current environment
const env = process.env;
const isProduction = env.NODE_ENV === 'production' || env.RAILWAY_ENVIRONMENT === 'production';

console.log(`📋 Environment: ${env.NODE_ENV || 'unknown'} (${isProduction ? 'Production' : 'Development'})`);
console.log(`🌐 Railway Environment: ${env.RAILWAY_ENVIRONMENT || 'not set'}`);

// Step 2: Check environment variables
const channelEnvVars = [
  'FEISHU_ENABLED',
  'DINGTALK_ENABLED', 
  'QQ_BOT_ENABLED',
  'WECOM_ENABLED',
  'TELEGRAM_ENABLED',
  'DISCORD_ENABLED',
  'SLACK_ENABLED',
  'IMESSAGE_ENABLED',
  'WHATSAPP_ENABLED',
  'LINE_ENABLED'
];

console.log('\n🔧 Environment Variables Status:');
channelEnvVars.forEach(varName => {
  const value = env[varName];
  console.log(`  ${value ? '✅' : '❌'} ${varName}: ${value || 'not set'}`);
});

// Step 3: Apply environment priority to config
console.log('\n🔄 Applying environment variable priority to config...');
try {
  // Set environment to enable priority
  process.env.APPLY_ENV_PRIORITY = 'true';
  
  // Run the environment priority script
  execSync(`node ${projectRoot}/scripts/env-channel-priority.ts`, {
    stdio: 'inherit',
    env: { ...process.env, APPLY_ENV_PRIORITY: 'true' }
  });
  
  console.log('✅ Environment priority applied successfully');
} catch (error) {
  console.error('❌ Failed to apply environment priority:', error);
  process.exit(1);
}

// Step 4: Verify config changes
console.log('\n📄 Verifying config changes...');
try {
  const configPath = path.join(projectRoot, 'moltbot.json');
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  
  console.log('📊 Channel Configuration Status:');
  Object.entries(config.channels || {}).forEach(([channel, config]: [string, any]) => {
    const envVar = channel.toUpperCase() + '_ENABLED';
    const envValue = env[envVar];
    const configValue = config.enabled;
    
    console.log(`  ${channel}: enabled=${configValue}${envValue ? ` (env: ${envValue})` : ''}`);
  });
} catch (error) {
  console.error('❌ Failed to verify config:', error);
}

// Step 5: Deploy to Railway (if in Railway environment)
if (isProduction && env.RAILWAY_SERVICE_NAME) {
  console.log('\n🚀 Deploying to Railway...');
  try {
    execSync('railway up', {
      stdio: 'inherit',
      env: { ...process.env, APPLY_ENV_PRIORITY: 'true' }
    });
    console.log('✅ Deployment completed successfully');
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
} else {
  console.log('\n📝 Skipping Railway deployment (not in production environment)');
}

// Step 6: Summary
console.log('\n📋 Deployment Summary:');
console.log('✅ Environment variable priority enabled');
console.log('✅ Configuration updated based on environment variables');
console.log('✅ Ready for testing');

console.log('\n🎯 Next Steps:');
console.log('1. Test the channels to ensure they work correctly');
console.log('2. Verify that the correct channels are enabled');
console.log('3. Check the logs for any configuration issues');

console.log('\n🔧 Testing Commands:');
console.log('  - Test Feishu: Check if Feishu channel is working');
console.log('  - Test other channels: Verify channel selection logic');
console.log('  - Check logs: Look for any configuration warnings');

console.log('\n🎉 Deployment with environment priority completed!');