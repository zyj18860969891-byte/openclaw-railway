with open('test_generated.json', 'rb') as f:
    content = f.read()
idx = content.find(b'"token": "')
if idx != -1:
    snippet = content[idx:idx+150]
    print('Token area:')
    print(snippet.decode('utf-8', errors='replace'))
    token_end = snippet.find(b'"', 20)
    if token_end != -1:
        token_bytes = snippet[20:token_end]
        if b'\n' in token_bytes or b'\r' in token_bytes:
            print('ERROR: Newline in token!')
        else:
            print('OK: Token is single line')