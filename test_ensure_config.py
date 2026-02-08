#!/usr/bin/env python3
import json
import os
import subprocess
import sys

# 设置环境变量
os.environ['OPENCLAW_GATEWAY_TOKEN'] = 'aE8D17b2aef960C736De1cDFDdc4806d314e2C2DebDedAe84A832fdbDefAEC7A'
os.environ['PORT'] = '8080'
os.environ['GATEWAY_TRUSTED_PROXIES'] = '100.64.0.0/10,23.227.167.3/32'
os.environ['MODEL_NAME'] = 'openrouter/stepfun/step-3.5-flash:free'

# 创建临时目录
os.makedirs('/tmp/openclaw', exist_ok=True)

# 直接执行Python代码生成配置
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

# 使用紧凑格式
json_str = json.dumps(config, separators=(',', ':'), ensure_ascii=False)
config_file = '/tmp/openclaw/openclaw.json'
with open(config_file, 'w', encoding='utf-8', newline='\n') as f:
    f.write(json_str)

print(f'✅ Generated {config_file}')

# 验证JSON
try:
    with open(config_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print('✅ JSON is valid')
    print(f"Token length: {len(data['gateway']['auth']['token'])}")
    print(f"Dingtalk clientSecret length: {len(data['channels']['dingtalk']['clientSecret'])}")

    # 检查文件中是否有换行符在token值内
    with open(config_file, 'rb') as f:
        content = f.read()
    token_pos = content.find(b'"token":"')
    if token_pos != -1:
        token_end = content.find(b'"', token_pos + 9)
        token_bytes = content[token_pos+9:token_end]
        if b'\n' in token_bytes or b'\r' in token_bytes:
            print('❌ ERROR: Newline found in token!')
            sys.exit(1)
        else:
            print('✅ Token is single line')
except Exception as e:
    print(f'❌ Error: {e}')
    sys.exit(1)