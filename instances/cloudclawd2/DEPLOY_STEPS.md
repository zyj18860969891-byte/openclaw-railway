# cloudclawd2 服务创建步骤

## 📋 当前状态

✅ 本地配置文件已准备好：
```
instances/cloudclawd2/
├── railway.toml          # Railway 配置
├── .env                  # 环境变量（待填写用户凭证）
├── Dockerfile.railway    # Docker 构建文件
├── fix-plugin-config.sh  # 配置脚本
└── package.json          # 项目配置
```

---

## 🚀 在 Railway Dashboard 创建新服务

### 步骤 1: 打开 Railway Dashboard

1. 访问: https://railway.app/project/openclaw-railway
2. 确认当前项目: **openclaw-railway**

### 步骤 2: 创建新服务

1. 点击 **"+ New Service"** 按钮
2. 选择 **"GitHub Repo"**
3. 选择仓库: **openclaw-railway**
4. 配置服务:
   - **Service Name**: `cloudclawd2`
   - **Root Directory**: `openclaw-main` (保持与主服务相同)
   - **Branch**: `main`

### 步骤 3: 设置环境变量

在服务创建后，进入 **Variables** 标签，添加以下变量：

```bash
# 基础配置
NODE_ENV=production
MODEL_NAME=openrouter/stepfun/step-3.5-flash:free

# 通道开关（根据需要修改）
FEISHU_ENABLED=true
DINGTALK_ENABLED=true
WECOM_ENABLED=false

# Gateway 认证
GATEWAY_AUTH_MODE=token
OPENCLAW_GATEWAY_TOKEN=cloudclawd2Token2026SecureKey987654321

# 浏览器配置
OPENCLAW_BROWSER_ENABLED=true
OPENCLAW_BROWSER_EXECUTABLE=/usr/bin/chromium
OPENCLAW_BROWSER_HEADLESS=true
OPENCLAW_BROWSER_NO_SANDBOX=true

# 技能配置
OPENCLAW_SKILLS_AUTO_INSTALL=false

# 持久化配置
OPENCLAW_STATE_DIR=/data/openclaw
OPENCLAW_CONFIG_PATH=/data/openclaw/openclaw.json

# 新用户的通道凭证（需要填写）
FEISHU_APP_ID=YOUR_FEISHU_APP_ID
FEISHU_APP_SECRET=YOUR_FEISHU_APP_SECRET
DINGTALK_CLIENT_ID=YOUR_DINGTALK_CLIENT_ID
DINGTALK_CLIENT_SECRET=YOUR_DINGTALK_CLIENT_SECRET
```

### 步骤 4: 创建独立 Volume

1. 进入服务 **Settings** 标签
2. 找到 **Volumes** 部分
3. 点击 **"Add Volume"**
4. 配置:
   - **Mount Path**: `/data`
   - **Size**: `1 GB` (足够使用)
   - **Name**: `cloudclawd2-volume`

### 步骤 5: 部署服务

1. 点击 **"Deploy"** 按钮
2. 等待构建完成（约 2-3 分钟）
3. 查看日志确认启动成功

---

## ✅ 验证部署

### 检查日志

```bash
# 使用 CLI 查看日志
railway logs --service cloudclawd2
```

### 预期日志输出

```
=== cloudclawd2 启动 ===
✅ 配置文件已生成
✅ 内置技能已复制到工作区和持久化目录
[feishu] WebSocket client connected
[dingtalk] Stream client connected
listening on ws://0.0.0.0:8080
```

---

## 🔑 重要信息

| 配置项 | 值 |
|-------|-----|
| 服务名称 | cloudclawd2 |
| Gateway Token | cloudclawd2Token2026SecureKey987654321 |
| Volume 挂载 | /data |
| Volume 大小 | 1 GB |

---

## 📝 下一步

1. **填写用户凭证**: 在 Railway Variables 中设置新用户的飞书/钉钉凭证
2. **配置 Webhook**: 在飞书/钉钉开放平台配置 Webhook URL
3. **测试连接**: 在对应平台发送消息测试

---

## 🔄 如果需要重新部署

```bash
cd instances/cloudclawd2
railway up
```
