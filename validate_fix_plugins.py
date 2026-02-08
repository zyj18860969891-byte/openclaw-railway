import json
import re

# 读取fix-plugins.sh文件
with open('fix-plugins.sh', 'r', encoding='utf-8') as f:
    content = f.read()

# 提取飞书插件JSON部分
pattern = r'cat > /app/extensions/feishu/openclaw\.plugin\.json << \'EOF\'\n(.*?)\nEOF'
match = re.search(pattern, content, re.DOTALL)

if match:
    feishu_json = match.group(1)
    print(f'提取的飞书插件JSON长度: {len(feishu_json)}')

    # 尝试解析
    try:
        data = json.loads(feishu_json)
        print('✅ fix-plugins.sh中的飞书插件JSON有效')
        print(f'插件ID: {data.get("id")}')
        print(f'插件名称: {data.get("name")}')
        print(f'配置属性数量: {len(data.get("configSchema", {}).get("properties", {}))}')
    except json.JSONDecodeError as e:
        print(f'❌ fix-plugins.sh中的飞书插件JSON无效: {e}')
        print(f'错误位置: {e.pos}')

        # 显示错误位置附近的字符
        if e.pos:
            start = max(0, e.pos - 100)
            end = min(len(feishu_json), e.pos + 100)
            print(f'错误上下文:')
            print(repr(feishu_json[start:end]))
else:
    print('未找到飞书插件JSON部分')