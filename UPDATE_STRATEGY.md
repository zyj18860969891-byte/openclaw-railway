# OpenClaw 多服务批量更新方案

## 问题

当部署多个服务后，如何统一更新所有服务？

---

## Railway 更新机制

### 方式 1: Git 自动部署（推荐）

```
GitHub Push → Railway 自动检测 → 自动重新构建部署
```

**配置方法**：
1. 在 Railway Dashboard → Service Settings
2. 启用 **"Auto Deploy"**
3. 选择分支：`main`

**优点**：
- ✅ 全自动，推送代码即更新
- ✅ 所有服务同时更新
- ✅ 无需手动操作

**缺点**：
- ⚠️ 所有服务同时重启，可能有短暂不可用

---

### 方式 2: 手动 Redeploy

```bash
# 单个服务重新部署
railway redeploy -s openclaw-railway -y
railway redeploy -s cloudclawd2 -y
railway redeploy -s cloudclawd3 -y
```

---

### 方式 3: 批量更新脚本

创建脚本一次性更新所有服务：

```powershell
# scripts-deploy\update-all-services.ps1
```

---

## 🎯 推荐方案：Git 自动部署 + 批量脚本

### 配置步骤

#### 1. 在 Railway Dashboard 启用自动部署

每个服务：
1. Settings → Build & Deploy
2. 启用 **Auto Deploy**
3. 选择 **Branch**: `main`
4. 选择 **Watch Paths**: `openclaw-main/**`（只监控主代码目录）

#### 2. 创建批量更新脚本

当需要手动控制更新时使用。

---

## 📋 更新流程

### 场景 A: 代码更新（自动）

```bash
# 1. 修改代码
git add .
git commit -m "feat: update feature"
git push origin main

# 2. Railway 自动检测并部署所有服务
# 无需手动操作
```

### 场景 B: 配置更新（手动）

```bash
# 修改环境变量后，需要手动重新部署
.\scripts-deploy\update-all-services.ps1
```

### 场景 C: 滚动更新（避免全部不可用）

```bash
# 逐个更新，确保服务可用
.\scripts-deploy\update-services-rolling.ps1
```

---

## 💡 最佳实践

### 1. 使用相同的代码仓库

```
所有服务 → 同一个 GitHub 仓库 → 同一个分支
```

### 2. 环境变量分离

```
每个服务 → 独立的环境变量 → 不同的用户凭证
```

### 3. 监控更新状态

```bash
# 查看所有服务状态
railway status
```

---

## 🔄 更新策略对比

| 策略 | 说明 | 适用场景 |
|-----|------|---------|
| **自动部署** | Git push 后自动更新 | 开发环境、快速迭代 |
| **手动批量** | 脚本一次性更新所有 | 生产环境、可控发布 |
| **滚动更新** | 逐个更新，保持可用 | 高可用要求 |
| **蓝绿部署** | 新旧版本并行切换 | 零停机要求 |

---

## 📝 总结

**推荐方案**：
1. ✅ 启用 Railway **Auto Deploy**（自动检测 Git 更新）
2. ✅ 创建批量更新脚本（手动控制时使用）
3. ✅ 使用滚动更新策略（避免服务中断）
