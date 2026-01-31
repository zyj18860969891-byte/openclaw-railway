# OpenClaw Railway 部署指南

基于 NotebookLM 的 Railway 部署和 OAuth 集成指南，本指南将帮助您在 Railway 平台上部署 OpenClaw。

## 🚀 快速开始

### 1. 准备工作

```bash
# 克隆项目
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# 安装依赖
pnpm install
```

### 2. Railway 部署

#### 方法一：Railway CLI 部署

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录 Railway
railway login

# 初始化项目
railway init

# 部署
railway up
```

#### 方法二：GitHub 部署

1. 将代码推送到 GitHub
2. 在 Railway 平台导入 GitHub 仓库
3. Railway 会自动检测 `railway.toml` 配置

### 3. 环境变量配置

复制 `.railway.env.example` 为 `.env` 并填入实际值：

```bash
cp .railway.env.example .env
```

必需的环境变量：
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `REDIRECT_URI`
- `DATABASE_URL`

## 🔧 配置详解

### OAuth 2.0 配置

1. **Google OAuth 设置**
   - 访问 [Google Cloud Console](https://console.cloud.google.com/)
   - 创建 OAuth 2.0 客户端 ID
   - 设置授权的重定向 URI

2. **配置文件**
   ```json
   // moltbot.json
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

### 容器配置

```dockerfile
# Dockerfile.railway
FROM node:22-alpine AS base
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

FROM base AS build
COPY . .
RUN pnpm build

FROM base AS runner
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

EXPOSE 3000
CMD ["dumb-init", "node", "dist/index.js"]
```

## 📋 部署清单

- [ ] Railway 账户创建
- [ ] Google OAuth 应用配置
- [ ] 环境变量设置
- [ ] 数据库配置
- [ ] 部署测试
- [ ] 域名配置（可选）

## 🔍 监控与调试

### 日志查看

```bash
# Railway CLI 查看日志
railway logs

# Railway Web 界面
# 访问 Railway 控制台查看实时日志
```

### 健康检查

```bash
# 检查服务状态
curl http://localhost:3000/health

# Railway 健康检查
# Railway 会自动配置健康检查端点
```

## 🚨 故障排除

### 常见问题

1. **部署失败**
   - 检查 `railway.toml` 配置
   - 确认环境变量设置
   - 查看 Railway 日志

2. **OAuth 认证失败**
   - 验证 Google OAuth 配置
   - 检查重定向 URI
   - 确认域名设置

3. **数据库连接问题**
   - 检查 `DATABASE_URL`
   - 确认数据库服务状态
   - 验证连接权限

### 性能优化

- 使用 Railway 的自动扩展
- 配置适当的内存限制
- 启用缓存机制

## 📚 相关文档

- [Railway 文档](https://docs.railway.app/)
- [OpenClaw 文档](https://docs.openclaw.app/)
- [OAuth 2.0 规范](https://oauth.net/2/)

## 🔄 更新维护

### 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建和部署
railway up
```

### 回滚版本

```bash
# 查看部署历史
railway deployments

# 回滚到特定版本
railway rollback <deployment-id>
```

---

*最后更新：2024年*