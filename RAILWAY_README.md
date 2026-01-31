# OpenClaw Railway 部署方案

基于 NotebookLM 的 Railway 部署和 OAuth 集成指南，本方案提供了完整的 Railway 部署解决方案。

## 📋 文件结构

```
openclaw-main/
├── moltbot.json                 # OpenClaw 主配置文件
├── start.sh                     # Linux 启动脚本
├── start.bat                    # Windows 启动脚本
├── Dockerfile.railway           # Railway 容器配置
├── railway.toml                 # Railway 部署配置
├── .railway.env.example         # 环境变量示例
├── RAILWAY_DEPLOYMENT.md        # 详细部署指南
├── deploy-railway.sh           # Linux/macOS 部署脚本
├── deploy-railway.ps1          # Windows 部署脚本
└── RAILWAY_README.md           # 本文件
```

## 🚀 快速部署

### Linux/macOS

```bash
# 给脚本执行权限
chmod +x deploy-railway.sh

# 运行部署脚本
./deploy-railway.sh
```

### Windows

```powershell
# 运行 PowerShell 脚本
.\deploy-railway.ps1
```

### 手动部署

```bash
# 1. 安装依赖
pnpm install

# 2. 构建项目
pnpm build

# 3. 配置环境变量
cp .railway.env.example .env
# 编辑 .env 文件

# 4. Railway 登录
railway login

# 5. 部署
railway up
```

## 🔧 核心配置

### 1. OAuth 2.0 集成

配置文件已支持 Google OAuth 2.0：

```json
{
  "oauth": {
    "enabled": true,
    "providers": {
      "google": {
        "clientId": "${GOOGLE_CLIENT_ID}",
        "clientSecret": "${GOOGLE_CLIENT_SECRET}",
        "redirectUri": "${REDIRECT_URI}"
      }
    }
  }
}
```

### 2. Railway 特定配置

```toml
# railway.toml
[build]
command = "pnpm build"

[deploy]
startCommand = "./start.sh"

[env]
NODE_ENV = "production"
PORT = "3000"
```

### 3. 容器优化

```dockerfile
# Dockerfile.railway
FROM node:22-alpine
# 多阶段构建，优化镜像大小
# 安全加固
# 健康检查
```

## 🎯 部署特性

### ✅ 已实现功能

- **OAuth 2.0 认证**：支持 Google OAuth 登录
- **容器化部署**：优化的 Docker 镜像
- **环境变量管理**：灵活的配置管理
- **自动启动**：跨平台启动脚本
- **健康检查**：服务状态监控
- **日志管理**：完整的日志记录

### 🔒 安全特性

- **环境变量加密**：敏感信息保护
- **容器安全**：最小权限原则
- **OAuth 安全**：标准认证流程
- **访问控制**：基于角色的权限

### 📊 性能优化

- **多阶段构建**：减小镜像大小
- **缓存优化**：构建缓存利用
- **资源限制**：内存和 CPU 限制
- **自动扩展**：Railway 自动扩展

## 🚨 注意事项

### 1. 环境变量

必须设置的环境变量：
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `REDIRECT_URI`
- `DATABASE_URL`

### 2. OAuth 配置

1. 在 [Google Cloud Console](https://console.cloud.google.com/) 创建 OAuth 应用
2. 设置授权的重定向 URI
3. 获取 Client ID 和 Client Secret

### 3. Railway 配置

- 确保 Railway 账户已创建
- 配置支付方式（免费额度有限）
- 选择合适的部署区域

## 🔄 维护更新

### 更新流程

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建
pnpm build

# 3. 重新部署
railway up
```

### 监控日志

```bash
# 查看实时日志
railway logs

# 查看部署状态
railway status

# 查看服务信息
railway info
```

## 📚 相关资源

- [Railway 官方文档](https://docs.railway.app/)
- [OpenClaw 文档](https://docs.openclaw.app/)
- [OAuth 2.0 规范](https://oauth.net/2/)
- [Google OAuth 文档](https://developers.google.com/identity/protocols/oauth2)

## 🆘 故障排除

### 常见问题

1. **部署失败**
   - 检查环境变量配置
   - 查看 Railway 日志
   - 确认依赖安装

2. **OAuth 认证问题**
   - 验证 Google OAuth 配置
   - 检查重定向 URI
   - 确认域名设置

3. **连接问题**
   - 检查网络连接
   - 验证数据库配置
   - 确认服务状态

### 获取帮助

- 查看 `RAILWAY_DEPLOYMENT.md` 获取详细说明
- 检查 Railway 控制台的日志
- 查看 OpenClaw 官方文档

---

*基于 NotebookLM Railway 部署指南创建*  
*最后更新：2024年*