# Railway 多服务部署方案对比

## 当前项目结构

```
Project: openclaw-railway
├── Environment: production
├── Service: openclaw-railway (当前运行)
└── Volume: openclaw-railway-volume
    ├── Mount: /data
    └── Usage: 187MB / 5000MB
```

---

## 方案对比

### 方案 A: 共享 Volume（多个服务共享同一个 Volume）

```
Project: openclaw-railway
├── Service: openclaw-railway (用户A - 飞书)
│   └── Volume: openclaw-railway-volume → /data
│
├── Service: openclaw-user-b (用户B - 钉钉)
│   └── Volume: openclaw-railway-volume → /data (共享)
│
└── Service: openclaw-user-c (用户C - 飞书)
    └── Volume: openclaw-railway-volume → /data (共享)
```

#### ✅ 优点
| 优点 | 说明 |
|-----|------|
| **成本低** | 只需一个 Volume 费用（$0.25/GB/月） |
| **存储共享** | 内置技能、插件只需存一份 |
| **部署简单** | 新服务直接挂载现有 Volume |
| **空间利用率高** | 5000MB 足够多个服务共用 |

#### ❌ 缺点
| 缺点 | 说明 |
|-----|------|
| **配置冲突风险** | 所有服务共享 `/data/openclaw/openclaw.json` |
| **数据隔离弱** | 一个服务误操作可能影响其他服务 |
| **并发写入问题** | 多服务同时写入可能导致数据损坏 |
| **故障传播** | Volume 损坏影响所有服务 |

#### 🔧 实现方式

需要修改配置路径，让每个服务使用独立的配置文件：

```bash
# 服务 A: /data/openclaw-a/openclaw.json
# 服务 B: /data/openclaw-b/openclaw.json
# 服务 C: /data/openclaw-c/openclaw.json
```

---

### 方案 B: 独立 Volume（每个服务独立 Volume）

```
Project: openclaw-railway
├── Service: openclaw-railway (用户A - 飞书)
│   └── Volume: openclaw-railway-volume → /data (独立)
│
├── Service: openclaw-user-b (用户B - 钉钉)
│   └── Volume: openclaw-user-b-volume → /data (独立)
│
└── Service: openclaw-user-c (用户C - 飞书)
    └── Volume: openclaw-user-c-volume → /data (独立)
```

#### ✅ 优点
| 优点 | 说明 |
|-----|------|
| **完全隔离** | 每个服务独立配置和数据 |
| **无冲突风险** | 配置文件路径相同，互不影响 |
| **故障隔离** | 一个 Volume 损坏不影响其他服务 |
| **安全性高** | 用户数据完全隔离 |
| **易于维护** | 删除服务时直接删除对应 Volume |
| **无需修改代码** | 所有服务使用相同配置路径 `/data/openclaw/` |

#### ❌ 缺点
| 缺点 | 说明 |
|-----|------|
| **成本略高** | 每个 Volume 独立计费 |
| **存储冗余** | 内置技能、插件每个服务都存一份 |
| **管理复杂** | 需要管理多个 Volume |

#### 💰 成本估算

```
共享 Volume:
- 1 个 Volume × 5GB × $0.25/GB/月 = $1.25/月

独立 Volume (5个服务):
- 5 个 Volume × 1GB × $0.25/GB/月 = $1.25/月
- 或 5 个 Volume × 5GB × $0.25/GB/月 = $6.25/月
```

---

## 🎯 推荐方案

### 推荐：方案 B - 独立 Volume

**理由：**

1. **配置简单** - 无需修改任何代码，每个服务使用相同配置
2. **完全隔离** - 用户数据和服务配置完全独立
3. **故障隔离** - 一个服务出问题不影响其他用户
4. **成本可控** - 每个服务只需 1GB Volume（$0.25/月）
5. **易于扩展** - 新增用户只需创建新服务+新 Volume

### 适用场景

| 场景 | 推荐方案 |
|-----|---------|
| **多用户生产环境** | ✅ 方案 B（独立 Volume） |
| **测试/开发环境** | 方案 A（共享 Volume） |
| **成本敏感** | 方案 A（共享 Volume） |
| **安全要求高** | ✅ 方案 B（独立 Volume） |
| **快速原型** | 方案 A（共享 Volume） |

---

## 📋 实施步骤

### 方案 B 实施步骤（推荐）

#### 步骤 1: 创建新服务配置

```powershell
# 创建新服务目录
mkdir instances\openclaw-user-b
cd instances\openclaw-user-b

# 复制必要文件
copy ..\..\Dockerfile.railway .
copy ..\..\fix-plugin-config.sh .
copy ..\..\package.json .
```

#### 步骤 2: 创建 railway.toml

```toml
# instances/openclaw-user-b/railway.toml
[build]
  builder = "dockerfile"
  dockerfilePath = "Dockerfile.railway"

[deploy]
  startCommand = "bash -c '/app/fix-plugin-config.sh && node dist/index.js gateway --allow-unconfigured --auth token --bind lan --port ${PORT:-8080}'"
  restartPolicyType = "always"

[env]
  # 用户 B 的专属配置
  FEISHU_ENABLED = "false"
  DINGTALK_ENABLED = "true"
  DINGTALK_CLIENT_ID = "用户B的钉钉ClientID"
  DINGTALK_CLIENT_SECRET = "用户B的钉钉ClientSecret"
  
  # 其他配置与主服务相同
  MODEL_NAME = "openrouter/stepfun/step-3.5-flash:free"
  GATEWAY_AUTH_MODE = "token"
  OPENCLAW_BROWSER_ENABLED = "true"
```

#### 步骤 3: 在 Railway 中创建新服务

```powershell
# 方式 1: 使用 Railway CLI
railway service create openclaw-user-b

# 方式 2: 在 Railway Dashboard 手动创建
# 1. 打开 https://railway.app/project/openclaw-railway
# 2. 点击 "+ New Service"
# 3. 选择 "GitHub Repo"
# 4. 选择相同的仓库，设置不同的配置
```

#### 步骤 4: 创建并挂载新 Volume

```powershell
# 创建新 Volume
railway volume add --service openclaw-user-b

# 或在 Dashboard:
# 1. 选择服务 openclaw-user-b
# 2. Settings → Volumes → Add Volume
# 3. 设置挂载路径: /data
# 4. 设置大小: 1GB (足够)
```

#### 步骤 5: 设置环境变量

```powershell
# 在 Railway Dashboard 或 CLI 设置
railway variables set --service openclaw-user-b \
  DINGTALK_CLIENT_ID="用户B的ClientID" \
  DINGTALK_CLIENT_SECRET="用户B的ClientSecret"
```

#### 步骤 6: 部署

```powershell
cd instances\openclaw-user-b
railway up
```

---

## 🔄 快速部署脚本

我将创建一个自动化脚本来简化这个过程：

```powershell
# 创建新用户服务（独立 Volume）
.\scripts-deploy\create-service.ps1 `
  -ServiceName "openclaw-user-b" `
  -ChannelType "dingtalk" `
  -ClientId "用户B的ClientID" `
  -ClientSecret "用户B的ClientSecret"
```

---

## 📊 总结

| 对比项 | 共享 Volume | 独立 Volume ⭐ |
|-------|------------|--------------|
| 隔离性 | ❌ 弱 | ✅ 强 |
| 安全性 | ⚠️ 中等 | ✅ 高 |
| 故障隔离 | ❌ 无 | ✅ 完全 |
| 配置复杂度 | ⚠️ 需修改路径 | ✅ 无需修改 |
| 成本 | ✅ 低 | ⚠️ 略高 |
| 维护难度 | ⚠️ 中等 | ✅ 简单 |
| 推荐度 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**最终建议：使用独立 Volume 方案，每个用户服务配备独立的 Volume，确保完全隔离和简化配置。**
