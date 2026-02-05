#!/usr/bin/env node
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

console.log('🔍 检查 OpenClaw 通道插件支持情况');

// 检查 extensions 目录
const extensionsDir = join(process.cwd(), 'extensions');
if (!existsSync(extensionsDir)) {
  console.log('❌ extensions 目录不存在');
  process.exit(1);
}

// 列出所有扩展目录
const extensions = readdirSync(extensionsDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

console.log('📁 发现的扩展目录:');
extensions.forEach(ext => {
  console.log(`  ✅ ${ext}`);
});

// 检查每个扩展的 package.json
console.log('\n📋 检查扩展配置:');
extensions.forEach(ext => {
  const pkgPath = join(extensionsDir, ext, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    console.log(`  📦 ${ext}: ${pkg.name || '未知包名'}`);
  } else {
    console.log(`  ⚠️  ${ext}: 无 package.json`);
  }
});

// 检查环境变量映射
console.log('\n🔧 环境变量映射:');
const envMappings = {
  feishu: 'FEISHU_ENABLED',
  dingtalk: 'DINGTALK_ENABLED',
  wecom: 'WECOM_ENABLED',
  telegram: 'TELEGRAM_ENABLED',
  discord: 'DISCORD_ENABLED',
  slack: 'SLACK_ENABLED',
  imessage: 'IMESSAGE_ENABLED',
  whatsapp: 'WHATSAPP_ENABLED',
  line: 'LINE_ENABLED'
};

Object.entries(envMappings).forEach(([channel, envVar]) => {
  const exists = extensions.includes(channel);
  console.log(`  ${exists ? '✅' : '❌'} ${channel} -> ${envVar}`);
});

console.log('\n📊 总结:');
console.log(`  总共支持 ${extensions.length} 个通道插件`);
console.log(`  环境变量控制: ${Object.keys(envMappings).length} 个通道`);