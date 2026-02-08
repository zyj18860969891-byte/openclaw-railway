import json
config = {
    'gateway': {
        'auth': {
            'token': 'aE8D17b2aef960C736De1cDFDdc4806d314e2C2DebDedAe84A832fdbDefAEC7A'
        }
    }
}
with open('test_single_line.json', 'w', encoding='utf-8') as f:
    json.dump(config, f, indent=2, ensure_ascii=False)
print("Generated")