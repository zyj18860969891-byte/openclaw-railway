with open('final_test_config.json', 'rb') as f:
    content = f.read()
idx = content.find(b'"token": "')
if idx != -1:
    snippet = content[idx:idx+150]
    print('Token area:')
    print(snippet.decode('utf-8', errors='replace'))
    if b'\n' in snippet:
        print('\nFound newline in token area!')
    else:
        print('No newline in token area')