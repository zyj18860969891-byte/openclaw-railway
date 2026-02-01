# OpenClaw Railway 令牌生成和管理指南

## 推荐的令牌生成方法

### 方法1: 使用OpenSSL（最推荐）
```bash
# 在Linux/macOS终端中
openssl rand -hex 32

# 在Windows PowerShell中
[Convert]::ToHexString((Get-Random -Minimum 0 -Maximum 256 -Count 32))
```

### 方法2: 使用Python脚本
```bash
python generate-token-python.py
```

### 方法3: 使用Node.js脚本
```bash
node generate-token-node.js
```

### 方法4: 使用在线生成器
访问推荐的在线生成器网站生成64字符的随机令牌。

## 令牌生成器使用示例

### 生成器1: OpenSSL
```bash
# 运行脚本
chmod +x generate-secure-token.sh
./generate-secure-token.sh

# 直接命令
openssl rand -hex 32
# 输出: a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678
```

### 生成器2: Python
```bash
python generate-token-python.py
# 输出示例:
# 1. 十六进制令牌（推荐）:
#    9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7
# 2. Base64令牌:
#    L7f8K9m3n5p7q1r3s5t7u9v2x4z6a8b0c2d4e6f8h0j2l4k6m8n0p2q4s6t8u0w2y4
```

### 生成器3: Node.js
```bash
node generate-token-node.js
# 输出示例:
# 1. 十六进制令牌（推荐）:
#    3f7a9e2b5c8d1f4a6b0c3d9e2f5a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6
# 2. Base64令牌:
#    5v8z3k9m1n7p2q5r8t1w3x6y9z2a5b8c1d3e6f9h2j4k7m0n5p8q1t3w6y9z2a5b8
```

## 在Railway中设置令牌

### 方法1: 通过Railway控制台（推荐）
1. 登录Railway控制台
2. 进入您的项目
3. 点击"Variables"选项卡
4. 添加新变量：
   - **Name**: `GATEWAY_TOKEN`
   - **Value**: `your_generated_token_here`
5. 保存更改

### 方法2: 通过railway.toml文件
```toml
[env]
  GATEWAY_TOKEN = "your_generated_token_here"
```

### 方法3: 通过Railway CLI
```bash
railway variables set GATEWAY_TOKEN your_generated_token_here
```

## 令牌安全最佳实践

### 1. 令牌要求
- **长度**: 至少32个字符（推荐64个）
- **字符集**: 0-9, a-f（十六进制）或更广泛的字符集
- **唯一性**: 确保令牌是唯一的
- **安全性**: 使用密码学安全的随机数生成器

### 2. 安全建议
- ✅ 使用密码学安全的随机数生成器
- ✅ 定期更换令牌（建议每30天）
- ✅ 不要在代码中硬编码令牌
- ✅ 不要将令牌提交到版本控制
- ✅ 使用环境变量存储令牌
- ✅ 监控令牌使用情况

### 3. 令牌轮换策略
```bash
# 生成新令牌
openssl rand -hex 32

# 更新Railway环境变量
railway variables set GATEWAY_TOKEN new_token_here

# 验证新令牌工作正常
# 等待24小时后移除旧令牌
```

## 故障排除

### 如果令牌无效
1. 检查令牌长度是否正确（至少32个字符）
2. 确认没有多余的空格或特殊字符
3. 重新生成令牌
4. 重启Railway服务

### 如果认证失败
1. 检查环境变量是否正确设置
2. 确认`GATEWAY_AUTH_MODE`设置为`token`
3. 验证`startCommand`包含`--auth token`参数

## 令牌格式示例

### 十六进制格式（推荐）
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678
9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7
3f7a9e2b5c8d1f4a6b0c3d9e2f5a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6
```

### Base64格式
```
L7f8K9m3n5p7q1r3s5t7u9v2x4z6a8b0c2d4e6f8h0j2l4k6m8n0p2q4s6t8u0w2y4
5v8z3k9m1n7p2q5r8t1w3x6y9z2a5b8c1d3e6f9h2j4k7m0n5p8q1t3w6y9z2a5b8
```

## 自动化令牌管理

### 创建令牌管理脚本
```bash
#!/bin/bash
# token-manager.sh

# 生成新令牌
NEW_TOKEN=$(openssl rand -hex 32)

# 更新Railway环境变量
railway variables set GATEWAY_TOKEN $NEW_TOKEN

# 备份旧令牌
echo "Old token: $(railway variables get GATEWAY_TOKEN)" >> /tmp/tokens.log

echo "新令牌已生成并设置: $NEW_TOKEN"
echo "请保存此令牌以备将来使用"
```

### 定期令牌轮换
```bash
# 添加到crontab
# 每月1号凌晨2点轮换令牌
0 2 1 * * /path/to/token-manager.sh
```

## 总结

我们提供了5种令牌生成方法：
1. **OpenSSL** - 最安全，推荐使用
2. **Python脚本** - 跨平台，功能丰富
3. **Node.js脚本** - 适合Node.js项目
4. **在线生成器** - 临时使用
5. **Railway内置** - 最简单

选择最适合您的方法，并遵循安全最佳实践来保护您的OpenClaw部署。