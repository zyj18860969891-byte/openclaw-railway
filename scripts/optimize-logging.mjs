#!/usr/bin/env node

/**
 * 日志优化脚本 - 解决Railway速率限制问题
 * 这个脚本会修改配置以减少日志输出量
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 优化日志配置
 */
export function optimizeLogging() {
  console.log('🔧 开始优化日志配置...');
  
  // 1. 检查并修改 railway.toml
  const railwayTomlPath = path.join(__dirname, '..', 'railway.toml');
  try {
    const content = fs.readFileSync(railwayTomlPath, 'utf8');
    
    // 检查是否已经有日志配置
    if (!content.includes('LOG_LEVEL=')) {
      // 在文件末尾添加日志配置
      const optimizedContent = content + `
  
  # === 日志配置 - 解决Railway速率限制问题 ===
  # 设置日志级别为 warn，只显示警告和错误信息
  LOG_LEVEL=warn
  # 或者使用 info 级别，但减少调试信息
  # LOG_LEVEL=info`;
      
      fs.writeFileSync(railwayTomlPath, optimizedContent);
      console.log('✅ 已更新 railway.toml 文件，添加日志级别配置');
    } else {
      console.log('✅ railway.toml 文件已包含日志配置');
    }
  } catch (error) {
    console.error('❌ 修改 railway.toml 失败:', error.message);
  }
  
  // 2. 检查并创建 .railway.env 文件
  const railwayEnvPath = path.join(__dirname, '..', '.railway.env');
  try {
    if (!fs.existsSync(railwayEnvPath)) {
      const envTemplate = `# OpenClaw Railway 环境变量配置
# 复制此文件为 .env 并填入实际值

# === 核心配置 ===
NODE_ENV=production
PORT=3000
MODEL_NAME=anthropic/claude-opus-4-5

# === OAuth 配置 ===
OAUTH_ENABLED=true
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
REDIRECT_URI=https://your-railway-domain.com/auth/google/callback

# === IM 渠道配置 ===
# 飞书配置
FEISHU_ENABLED=true
FEISHU_APP_ID=your-feishu-app-id
FEISHU_APP_SECRET=your-feishu-app-secret

# 钉钉配置
DINGTALK_ENABLED=true
DINGTALK_CLIENT_ID=your-dingtalk-client-id
DINGTALK_CLIENT_SECRET=your-dingtalk-client-secret

# === 网关配置 ===
GATEWAY_TAILSCALE_MODE=funnel
GATEWAY_AUTH_MODE=password

# === 安全配置 ===
SANDBOX_MODE=non-main
DM_SCOPE=per-peer

# === 加密配置 ===
ENCRYPTION_KEY=your-encryption-key-here

# === Railway 特定配置 ===
RAILWAY_TOKEN=your-railway-token
DATABASE_URL=your-database-url
OPENCLAW_STATE_DIR=/app/.openclaw
OPENCLAW_PREFER_PNPM=1

# === 日志配置 - 解决Railway速率限制问题 ===
# 设置日志级别为 warn，只显示警告和错误信息
LOG_LEVEL=warn
# 或者使用 info 级别，但减少调试信息
# LOG_LEVEL=info

# === 性能配置 ===
NODE_OPTIONS=--max-old-space-size=1536

# === 健康检查 ===
HEALTHCHECK_ENABLED=true
`;
      
      fs.writeFileSync(railwayEnvPath, envTemplate);
      console.log('✅ 已创建 .railway.env 文件');
    } else {
      console.log('✅ .railway.env 文件已存在');
    }
  } catch (error) {
    console.error('❌ 创建 .railway.env 文件失败:', error.message);
  }
  
  // 3. 提供使用说明
  console.log('\n📋 使用说明:');
  console.log('1. 将 .railway.env 复制为 .env 并填入实际值');
  console.log('2. 重新部署到 Railway');
  console.log('3. 部署后检查日志是否还有速率限制警告');
  console.log('\n🔧 如果问题仍然存在，可以尝试:');
  console.log('- 将 LOG_LEVEL 设置为 "error"（只显示错误）');
  console.log('- 检查应用程序是否有过多的调试日志输出');
  console.log('- 考虑使用日志缓冲或节流技术');
}

/**
 * 恢复默认日志配置
 */
export function restoreDefaultLogging() {
  console.log('🔄 恢复默认日志配置...');
  
  const railwayTomlPath = path.join(__dirname, '..', 'railway.toml');
  try {
    const content = fs.readFileSync(railwayTomlPath, 'utf8');
    
    // 移除日志配置部分
    const optimizedContent = content.replace(
      /# === 日志配置 - 解决Railway速率限制问题 ===[\s\S]*?(?=  #|$)/g,
      ''
    ).trim();
    
    fs.writeFileSync(railwayTomlPath, optimizedContent);
    console.log('✅ 已恢复 railway.toml 默认配置');
  } catch (error) {
    console.error('❌ 恢复 railway.toml 失败:', error.message);
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  const action = process.argv[2] || 'optimize';
  
  if (action === 'optimize') {
    optimizeLogging();
  } else if (action === 'restore') {
    restoreDefaultLogging();
  } else {
    console.log('用法:');
    console.log('node scripts/optimize-logging.mjs [optimize|restore]');
    console.log('  optimize - 优化日志配置（默认）');
    console.log('  restore - 恢复默认配置');
  }
}