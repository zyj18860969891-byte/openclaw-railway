#!/bin/bash

echo "=== 确保controlUi配置 ==="

# 使用环境变量或默认值
CONFIG_FILE="${OPENCLAW_CONFIG_PATH:-/data/openclaw/openclaw.json}"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ 配置文件不存在: $CONFIG_FILE"
    exit 1
fi

# 使用node强制设置controlUi配置
node -e "const fs = require('fs'); const path = '${CONFIG_FILE}'; try { const cfg = JSON.parse(fs.readFileSync(path, 'utf8')); if (!cfg.gateway) cfg.gateway = {}; if (!cfg.gateway.controlUi) cfg.gateway.controlUi = {}; cfg.gateway.controlUi.enabled = true; cfg.gateway.controlUi.allowInsecureAuth = true; cfg.gateway.controlUi.dangerouslyDisableDeviceAuth = true; cfg.gateway.controlUi.basePath = '/'; fs.writeFileSync(path, JSON.stringify(cfg, null, 2)); console.log('✅ controlUi配置已强制设置'); } catch (err) { console.error('❌ 设置controlUi配置失败:', err.message); process.exit(1); }"

# 显示配置中的controlUi部分
echo "配置中的controlUi部分："
grep -A 5 '"controlUi"' "$CONFIG_FILE" || echo "未找到controlUi配置"

echo "=== controlUi配置确保完成 ==="
