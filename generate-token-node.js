#!/usr/bin/env node

const crypto = require('crypto');

function generateSecureToken() {
    // 生成32字节的随机令牌（64个十六进制字符）
    const token = crypto.randomBytes(32).toString('hex');
    return token;
}

function generateBase64Token() {
    // 生成32字节的随机令牌，Base64编码
    const token = crypto.randomBytes(32).toString('base64url');
    return token;
}

console.log('=== OpenClaw Railway 安全令牌生成器 ===');
console.log();

// 生成十六进制令牌
const hexToken = generateSecureToken();
console.log('1. 十六进制令牌（推荐）：');
console.log(`   ${hexToken}`);
console.log();

// 生成Base64令牌
const b64Token = generateBase64Token();
console.log('2. Base64令牌：');
console.log(`   ${b64Token}`);
console.log();

console.log('=== 使用说明 ===');
console.log('1. 复制其中一个令牌');
console.log('2. 在Railway控制台中添加环境变量：');
console.log('   GATEWAY_TOKEN=your_token_here');
console.log('3. 或在railway.toml中设置：');
console.log('   GATEWAY_TOKEN = "your_token_here"');
console.log();

// 保存到文件
const fs = require('fs');
const path = require('path');
const tokenDir = path.join('/tmp', 'openclaw');
if (!fs.existsSync(tokenDir)) {
    fs.mkdirSync(tokenDir, { recursive: true });
}
fs.writeFileSync(path.join(tokenDir, 'gateway_token.txt'), hexToken);
console.log('令牌已保存到 /tmp/openclaw/gateway_token.txt');