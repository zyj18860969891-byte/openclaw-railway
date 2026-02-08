#!/bin/bash
set -e

CONFIG_FILE="/tmp/openclaw/openclaw.json"
mkdir -p "/tmp/openclaw"

if [ -f "$CONFIG_FILE" ]; then
    rm "$CONFIG_FILE"
fi

PORT=${PORT:-8080}
TOKEN=${OPENCLAW_GATEWAY_TOKEN:-$TOKEN}
GATEWAY_TRUSTED_PROXIES=${GATEWAY_TRUSTED_PROXIES:-"100.64.0.0/10,23.227.167.3/32"}
MODEL_NAME=${MODEL_NAME:-"openrouter/stepfun/step-3.5-flash:free"}

if [ -z "$TOKEN" ]; then
    echo "错误: OPENCLAW_GATEWAY_TOKEN 或 TOKEN 环境变量未设置"
    exit 1
fi

echo "生成配置文件: $CONFIG_FILE"
echo "端口: $PORT"
echo "模型: $MODEL_NAME"
echo "飞书和钉钉通道已启用"

# 生成JSON配置文件，使用紧凑格式避免长字符串换行
python3 -c "
import json
import os

port = int(os.getenv('PORT', '8080'))
token = os.getenv('OPENCLAW_GATEWAY_TOKEN', '')
if not token:
    token = os.getenv('TOKEN', '')
if not token:
    token = 'aE8D17b2aef960C736De1cDFDdc4806d314e2C2DebDedAe84A832fdbDefAEC7A'

trusted_proxies = os.getenv('GATEWAY_TRUSTED_PROXIES', '100.64.0.0/10,23.227.167.3/32').split(',')
model_name = os.getenv('MODEL_NAME', 'openrouter/stepfun/step-3.5-flash:free')

config = {
    'agents': {
        'defaults': {
            'model': {'primary': model_name},
            'workspace': '/tmp/openclaw',
            'sandbox': {'mode': 'non-main'}
        }
    },
    'gateway': {
        'mode': 'local',
        'port': port,
        'bind': 'lan',
        'auth': {'mode': 'token', 'token': token},
        'trustedProxies': [p.strip() for p in trusted_proxies if p.strip()],
        'controlUi': {'enabled': True, 'allowInsecureAuth': True, 'dangerouslyDisableDeviceAuth': True}
    },
    'canvasHost': {'enabled': True},
    'logging': {'level': 'info', 'consoleStyle': 'json'},
    'channels': {
        'feishu': {'enabled': True, 'appId': 'cli_a90b00a3bd799cb1', 'appSecret': 'LPjfXz3MxIlkLzsZOwXJIfVht0il4gEj', 'dmPolicy': 'open', 'groupPolicy': 'open'},
        'dingtalk': {'enabled': True, 'clientId': 'dingwmptjicih9yk2dmr', 'clientSecret': 'w8p_LcdLbsjMNeaGHn3kyd8s6Q91SXmItawbm_JgBKsOSdsoo3MYuG_JMuzfkxh5', 'dmPolicy': 'open', 'groupPolicy': 'open'}
    }
}

# 使用紧凑格式，确保长字符串不换行
json_str = json.dumps(config, separators=(',', ':'), ensure_ascii=False)
with open('$CONFIG_FILE', 'w', encoding='utf-8', newline='\n') as f:
    f.write(json_str)
"

echo "验证JSON格式..."
if python3 -m json.tool "$CONFIG_FILE" > /dev/null 2>&1; then
    echo "✅ JSON格式正确"
else
    echo "❌ JSON格式错误"
    cat "$CONFIG_FILE" >&2
    exit 1
fi

echo "配置文件内容："
cat "$CONFIG_FILE"

export OPENCLAW_STATE_DIR="/tmp/openclaw"
export OPENCLAW_CONFIG_PATH="/tmp/openclaw/openclaw.json"

echo "环境变量已设置"
echo "配置文件检查完成"