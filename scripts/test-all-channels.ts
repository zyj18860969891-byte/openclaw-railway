#!/usr/bin/env node
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

// 读取 copy-plugins.ts 文件来获取通道映射
const copyPluginsPath = join(process.cwd(), 'scripts', 'copy-plugins.ts');
const copyPluginsContent = readFileSync(copyPluginsPath, 'utf8');

// 提取 CHANNEL_PLUGINS 映射
const channelPluginsMatch = copyPluginsContent.match(/CHANNEL_PLUGINS\s*=\s*{([^}]+)}/s);
if (!channelPluginsMatch) {
  console.error('❌ 无法找到 CHANNEL_PLUGINS 映射');
  process.exit(1);
}

const channelPluginsContent = channelPluginsMatch[1];
// 提取所有通道名称
const channelMatches = channelPluginsContent.match(/(\w+)\s*:/g);
if (!channelMatches) {
  console.error('❌ 无法解析通道名称');
  process.exit(1);
}

const channels = channelMatches.map(match => match.replace(':', '').trim());
console.log('🔍 检测到的通道映射:');
channels.forEach(channel => {
  console.log(`  ✅ ${channel}`);
});

console.log('\n📋 测试所有通道的环境变量组合:');

// 测试所有通道的组合
const testScenarios = [
  { name: '所有通道', env: channels.map(ch => `${ch.toUpperCase()}_ENABLED=true`).join(' ') },
  { name: '飞书+钉钉', env: 'FEISHU_ENABLED=true DINGTALK_ENABLED=true' },
  { name: '微信+Telegram', env: 'WECOM_ENABLED=true TELEGRAM_ENABLED=true' },
  { name: 'Discord+Slack', env: 'DISCORD_ENABLED=true SLACK_ENABLED=true' },
  { name: 'iMessage+WhatsApp', env: 'IMESSAGE_ENABLED=true WHATSAPP_ENABLED=true' },
  { name: 'Line', env: 'LINE_ENABLED=true' },
  { name: '无通道', env: '' }
];

testScenarios.forEach(scenario => {
  console.log(`\n📋 场景: ${scenario.name}`);
  console.log(`   环境: ${scenario.env || '{}'}`);
  
  // 模拟环境变量检测逻辑
  const enabledChannels = [];
  channels.forEach(channel => {
    const envVar = `${channel.toUpperCase()}_ENABLED`;
    if (scenario.env.includes(`${envVar}=true`)) {
      enabledChannels.push(channel);
    }
  });
  
  if (enabledChannels.length > 0) {
    console.log(`   将复制插件: ${enabledChannels.join(', ')}`);
  } else {
    console.log(`   将复制插件: none`);
  }
});

console.log('\n✅ 所有通道映射测试完成');
console.log(`📊 总共支持 ${channels.length} 个通道: ${channels.join(', ')}`);