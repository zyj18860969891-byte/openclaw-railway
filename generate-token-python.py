#!/usr/bin/env python3
import secrets
import string
import sys

def generate_secure_token(length=64):
    """生成安全的随机令牌"""
    # 使用十六进制字符集
    alphabet = string.hexdigits  # 0-9, a-f, A-F
    # 使用secrets模块生成密码学安全的随机数
    token = ''.join(secrets.choice(alphabet) for _ in range(length))
    return token

def generate_base64_token(length=32):
    """生成Base64编码的安全令牌"""
    import base64
    # 生成32字节的随机数据
    random_bytes = secrets.token_bytes(length)
    # Base64编码
    token = base64.urlsafe_b64encode(random_bytes).decode('utf-8')
    return token

if __name__ == "__main__":
    print("=== OpenClaw Railway 安全令牌生成器 ===")
    print()
    
    # 生成十六进制令牌
    hex_token = generate_secure_token(64)
    print("1. 十六进制令牌（推荐）：")
    print(f"   {hex_token}")
    print()
    
    # 生成Base64令牌
    b64_token = generate_base64_token(32)
    print("2. Base64令牌：")
    print(f"   {b64_token}")
    print()
    
    print("=== 使用说明 ===")
    print("1. 复制其中一个令牌")
    print("2. 在Railway控制台中添加环境变量：")
    print("   GATEWAY_TOKEN=your_token_here")
    print("3. 或在railway.toml中设置：")
    print("   GATEWAY_TOKEN = \"your_token_here\"")
    print()
    
    # 保存到文件
    with open('/tmp/openclaw/gateway_token.txt', 'w') as f:
        f.write(hex_token)
    print("令牌已保存到 /tmp/openclaw/gateway_token.txt")