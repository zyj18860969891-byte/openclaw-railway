with open('test_config3.json', 'rb') as f:
    content = f.read()
idx = content.find(b'"token":')
if idx != -1:
    snippet = content[idx:idx+200]
    print('Token area bytes:')
    print(snippet)
    print()
    print('Token area as string:')
    print(snippet.decode('utf-8', errors='replace'))