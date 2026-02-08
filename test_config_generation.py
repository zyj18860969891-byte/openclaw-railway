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
    "agents": {
        "defaults": {
            "model": {"primary": model_name},
            "workspace": "/tmp/openclaw",
            "sandbox": {"mode": "non-main"}
        }
    },
    "gateway": {
        "mode": "local",
        "port": port,
        "bind": "lan",
        "auth": {"mode": "token", "token": token},
        "trustedProxies": [p.strip() for p in trusted_proxies if p.strip()],
        "controlUi": {"enabled": True, "allowInsecureAuth": True, "dangerouslyDisableDeviceAuth": True}
    },
    "canvasHost": {"enabled": True},
    "logging": {"level": "info", "consoleStyle": "json"},
    "channels": {
        "feishu": {"enabled": True, "appId": "cli_a90b00a3bd799cb1", "appSecret": "LPjfXz3MxIlkLzsZOwXJIfVht0il4gEj", "dmPolicy": "open", "groupPolicy": "open"},
        "dingtalk": {"enabled": True, "clientId": "dingwmptjicih9yk2dmr", "clientSecret": "w8p_LcdLbsjMNeaGHn3kyd8s6Q91SXmItawbm_JgBKsOSdsoo3MYuG_JMuzfkxh5", "dmPolicy": "open", "groupPolicy": "open"}
    }
}

with open('test_generated.json', 'w', encoding='utf-8') as f:
    json.dump(config, f, indent=2, ensure_ascii=False)

print('Generated test_generated.json')