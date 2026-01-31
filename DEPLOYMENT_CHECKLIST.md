# OpenClaw Railway 部署检查清单

## 📋 部署前检查

### 1. 环境变量配置
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth 客户端 ID
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth 客户端密钥
- [ ] `REDIRECT_URI` - OAuth 重定向 URI
- [ ] `DATABASE_URL` - 数据库连接字符串
- [ ] `RAILWAY_TOKEN` - Railway API 令牌

### 2. 文件完整性检查
- [ ] `railway.toml` - Railway 部署配置
- [ ] `moltbot.json` - OpenClaw 主配置
- [ ] `start.sh` - Linux 启动脚本
- [ ] `start.bat` - Windows 启动脚本
- [ ] `Dockerfile.railway` - Railway 容器配置
- [ ] `.railway.env.example` - 环境变量示例

### 3. OAuth 配置检查
- [ ] Google OAuth 应用已创建
- [ ] OAuth 重定向 URI 已配置
- [ ] 客户端 ID 和密钥已设置
- [ ] OAuth 回调 URL 正确配置

### 4. 依赖项检查
- [ ] `package.json` 中包含所有依赖项
- [ ] `pnpm` 依赖已安装
- [ ] Docker 环境已准备就绪

## 🚀 部署步骤

### 步骤 1: 准备环境
```bash
# 克隆项目
git clone https://github.com/openclaw/openclaw.git
cd openclaw

# 安装依赖
pnpm install
```

### 步骤 2: 配置环境变量
```bash
# 复制环境变量示例文件
cp .railway.env.example .env

# 编辑 .env 文件，填入实际值
vim .env
```

### 步骤 3: 构建和部署
```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录 Railway
railway login

# 部署
railway up
```

## 🔧 常见问题排查

### 1. 构建失败
- 检查 `Dockerfile.railway` 配置
- 确认依赖项安装正确
- 检查 `package.json` 依赖

### 2. 环境变量问题
- 确保所有必需的环境变量已设置
- 检查 `.env` 文件格式
- 验证变量名称拼写

### 3. OAuth 认证失败
- 验证 Google OAuth 配置
- 检查重定向 URI
- 确认域名设置正确

### 4. 服务启动失败
- 检查 `start.sh` 和 `start.bat` 脚本
- 验证端口配置
- 查看 Railway 日志

## 📊 监控和调试

### 查看部署状态
```bash
# 查看部署状态
railway status

# 查看日志
railway logs

# 查看服务信息
railway info
```

### 健康检查
```bash
# 检查服务健康状态
curl http://localhost:3000/health
```

## 🔄 更新和维护

### 重新部署
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

## 📚 相关文档

- [Railway 文档](https://docs.railway.app/)
- [OpenClaw 文档](https://docs.openclaw.app/)
- [OAuth 2.0 规范](https://oauth.net/2/)
- [Google OAuth 文档](https://developers.google.com/identity/protocols/oauth2)