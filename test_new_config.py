import json
import os
import sys

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

# 生成紧凑JSON（无缩进），确保长字符串不换行
compact_json = json.dumps(config, separators=(',', ':'), ensure_ascii=False)
# 验证JSON
parsed = json.loads(compact_json)
print('✅ Compact JSON is valid')

# 写入文件（紧凑格式，无换行）
with open('new_test_config.json', 'w', encoding='utf-8', newline='\n') as f:
    f.write(compact_json)

print('Generated new_test_config.json (compact)')