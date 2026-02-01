# OpenClaw Railway 部署检查清单

## 🔧 配置检查

### ✅ 必需文件
- [ ] `pnpm-lock.yaml` 存在
- [ ] `railway.toml` 存在
- [ ] `Dockerfile` 存在
- [ ] `package.json` 存在

### ✅ Railway 配置
- [ ] `railway.toml` 中使用 `builder = "dockerfile"`
- [ ] `railway.toml` 中指定 `dockerfilePath = "Dockerfile"`
- [ ] 端口配置为 `8080`
- [ ] 启用 `forceHTTPS = true`

### ✅ Dockerfile 配置
- [ ] 暴露端口 `8080` (`EXPOSE 8080`)
- [ ] 设置 `ENV PORT=8080`
- [ ] 包含 `pnpm-lock.yaml` 复制
- [ ] 使用 `pnpm install --frozen-lockfile`

### ✅ .dockerignore 配置
- [ ] 不排除 `pnpm-lock.yaml`
- [ ] 包含 `!pnpm-lock.yaml` 规则

## 🚀 部署步骤

### 1. 准备工作
```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录 Railway
railway login

# 检查配置
./deploy-railway-fixed.sh  # 或 ./deploy-railway-fixed.ps1
```

### 2. 部署到 Railway
```bash
# 推送代码到 GitHub（如果使用 GitHub 部署）
git add .
git commit -m "Fix Railway deployment configuration"
git push origin main

# 部署到 Railway
railway up
```

### 3. Railway 控制台设置
1. **启用 HTTP Proxy**
   - 端口：`8080`
   - 协议：`HTTP`

2. **添加 Volume**
   - 挂载路径：`/data`
   - 名称：`openclaw-data`

3. **设置环境变量**
   ```
   SETUP_PASSWORD=your_secure_password
   NODE_ENV=production
   PORT=8080
   MODEL_NAME=anthropic/claude-opus-4-5
   OAUTH_ENABLED=true
   GATEWAY_AUTH_MODE=password
   SANDBOX_MODE=non-main
   DM_SCOPE=per-peer
   OPENCLAW_STATE_DIR=/data/.openclaw
   OPENCLAW_WORKSPACE_DIR=/data/workspace
   ```

### 4. 验证部署
- 访问 `https://<your-domain>/setup` 进行初始设置
- 访问 `https://<your-domain>/openclaw` 访问控制界面

## 🔍 故障排除

### 常见问题

#### 1. `pnpm-lock.yaml: not found`
**原因**：Railway 构建上下文没有包含 `pnpm-lock.yaml`
**解决方案**：
- 检查 `.dockerignore` 是否排除了 `pnpm-lock.yaml`
- 确保 `railway.toml` 使用 Docker 构建器
- 重新运行部署脚本

#### 2. 端口不匹配
**原因**：Railway 配置中的端口与实际服务端口不匹配
**解决方案**：
- 确保 `railway.toml` 中的 `internalPort = 8080`
- 确保 Dockerfile 中有 `EXPOSE 8080`
- 确保 `ENV PORT=8080`

#### 3. 构建失败
**原因**：依赖安装问题
**解决方案**：
- 确保 `pnpm-lock.yaml` 是最新的
- 检查 `package.json` 中的依赖
- 重新运行 `pnpm install`

### 调试命令
```bash
# 查看 Railway 日志
railway logs

# 本地测试 Docker 构建
docker build -t openclaw-test .

# 检查 Railway 配置
railway whoami

# 检查 Railway 服务状态
railway status
```

## 📝 部署后维护

### 备份和恢复
- 备份文件：`https://<your-domain>/setup/export`
- 恢复备份：将备份文件上传到 Railway Volume

### 更新部署
```bash
# 推送代码更新
git add .
git commit -m "Update OpenClaw"
git push origin main

# 重新部署
railway up
```

### 监控和日志
- 查看 Railway 日志：`railway logs`
- 检查服务状态：`railway status`
- 设置健康检查：已在配置中启用

---

## 🎯 成功标准

部署成功后，你应该能够：
1. 访问 `https://<your-domain>/setup` 并完成设置向导
2. 访问 `https://<your-domain>/openclaw` 并看到控制界面
3. 在 Railway 控制台中看到服务运行正常
4. 日志中没有错误信息

如果遇到问题，请按照故障排除部分进行调试。