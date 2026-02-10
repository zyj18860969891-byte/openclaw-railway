# OpenClaw 多实例重复部署方案

> 实现同一套代码重复部署多个独立服务实例，每个实例服务于不同的用户/通道

---

## 目录

1. [方案概述](#1-方案概述)
2. [单实例 vs 多实例](#2-单实例-vs-多实例)
3. [多实例部署架构](#3-多实例部署架构)
4. [快速部署脚本](#4-快速部署脚本)
5. [新用户部署流程](#5-新用户部署流程)
6. [实例管理](#6-实例管理)
7. [成本估算](#-成本估算)

---

## 1. 方案概述

### 目标
将当前已成功部署的 `openclaw-railway` 服务模板化，实现：
- ✅ 一键创建新实例
- ✅ 新用户只需配置自己的通道环境变量
- ✅ 实例之间完全隔离
- ✅ 统一代码库，独立配置

### 核心思路
```
模板实例 (openclaw-main)
    │
    ├── 复制配置文件
    ├── 修改实例名称
    ├── 设置用户专属环境变量
    └── 部署到 Railway 新服务
         │
         └── 新实例 (openclaw-user-xxx)
```

---

## 2. 单实例 vs 多实例

### 单实例多通道（当前方案）

```
┌─────────────────────────────────────┐
│        openclaw-main (单实例)        │
├─────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌────────┐ │
│  │ 飞书A   │ │ 钉钉B   │ │ 飞书C  │ │
│  │ 用户1   │ │ 用户2   │ │ 用户3  │ │
│  └─────────┘ └─────────┘ └────────┘ │
│                                     │
│  共享: CPU / 内存 / WebSocket 连接  │
└─────────────────────────────────────┘
```

**优点**: 成本低，部署简单
**缺点**: 资源竞争，故障影响所有用户

### 多实例完全隔离（推荐方案）

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ openclaw-user-1  │  │ openclaw-user-2  │  │ openclaw-user-3  │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤
│ ┌──────────────┐ │  │ ┌──────────────┐ │  │ ┌──────────────┐ │
│ │ 飞书 (用户1) │ │  │ │ 钉钉 (用户2) │ │  │ │ 飞书 (用户3) │ │
│ └──────────────┘ │  │ └──────────────┘ │  │ └──────────────┘ │
│                  │  │                  │  │                  │
│ 独立: CPU/内存   │  │ 独立: CPU/内存   │  │ 独立: CPU/内存   │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

**优点**: 完全隔离，独立扩展，故障不影响其他用户
**缺点**: 成本略高（每个实例独立计费）

---

## 3. 多实例部署架构

### 目录结构

```
moltbot-railway/
├── openclaw-main/              # 模板实例（当前已部署）
│   ├── Dockerfile.railway
│   ├── railway.toml
│   ├── fix-plugin-config.sh
│   └── src/
│
├── instances/                  # 多实例目录
│   ├── openclaw-user-feishu-1/    # 用户1飞书实例
│   │   ├── railway.toml           # 用户1专属配置
│   │   └── .env                   # 用户1环境变量
│   │
│   ├── openclaw-user-dingtalk-1/  # 用户2钉钉实例
│   │   ├── railway.toml
│   │   └── .env
│   │
│   └── openclaw-user-wecom-1/     # 用户3企业微信实例
│       ├── railway.toml
│       └── .env
│
├── scripts/                    # 部署脚本
│   ├── create-instance.sh      # 创建新实例
│   ├── deploy-instance.sh      # 部署实例
│   └── list-instances.sh       # 列出所有实例
│
└── templates/                  # 配置模板
    ├── railway.template.toml   # Railway 配置模板
    └── env.template            # 环境变量模板
```

---

## 4. 快速部署脚本

### 4.1 创建实例脚本

```bash
#!/bin/bash
# scripts/create-instance.sh
# 用法: ./create-instance.sh <用户名> <通道类型> [通道配置]

set -e

USERNAME=$1
CHANNEL_TYPE=$2
CHANNEL_CONFIG=$3

if [ -z "$USERNAME" ] || [ -z "$CHANNEL_TYPE" ]; then
    echo "用法: ./create-instance.sh <用户名> <通道类型> [通道配置JSON]"
    echo "示例: ./create-instance.sh zhangsan feishu '{\"appId\":\"cli_xxx\",\"appSecret\":\"xxx\"}'"
    exit 1
fi

INSTANCE_NAME="openclaw-${USERNAME}-${CHANNEL_TYPE}"
INSTANCE_DIR="instances/${INSTANCE_NAME}"

echo "=== 创建新实例: ${INSTANCE_NAME} ==="

# 创建实例目录
mkdir -p "$INSTANCE_DIR"

# 复制模板配置
cp templates/railway.template.toml "${INSTANCE_DIR}/railway.toml"
cp templates/env.template "${INSTANCE_DIR}/.env"

# 替换实例名称
sed -i "s/{{INSTANCE_NAME}}/${INSTANCE_NAME}/g" "${INSTANCE_DIR}/railway.toml"
sed -i "s/{{USERNAME}}/${USERNAME}/g" "${INSTANCE_DIR}/.env"

# 根据通道类型配置
case "$CHANNEL_TYPE" in
    "feishu")
        sed -i "s/{{CHANNEL_TYPE}}/feishu/g" "${INSTANCE_DIR}/railway.toml"
        sed -i "s/{{FEISHU_ENABLED}}/true/g" "${INSTANCE_DIR}/.env"
        sed -i "s/{{DINGTALK_ENABLED}}/false/g" "${INSTANCE_DIR}/.env"
        sed -i "s/{{WECOM_ENABLED}}/false/g" "${INSTANCE_DIR}/.env"
        # 解析并设置飞书配置
        if [ -n "$CHANNEL_CONFIG" ]; then
            APP_ID=$(echo "$CHANNEL_CONFIG" | jq -r '.appId')
            APP_SECRET=$(echo "$CHANNEL_CONFIG" | jq -r '.appSecret')
            sed -i "s/{{FEISHU_APP_ID}}/${APP_ID}/g" "${INSTANCE_DIR}/.env"
            sed -i "s/{{FEISHU_APP_SECRET}}/${APP_SECRET}/g" "${INSTANCE_DIR}/.env"
        fi
        ;;
    "dingtalk")
        sed -i "s/{{CHANNEL_TYPE}}/dingtalk/g" "${INSTANCE_DIR}/railway.toml"
        sed -i "s/{{FEISHU_ENABLED}}/false/g" "${INSTANCE_DIR}/.env"
        sed -i "s/{{DINGTALK_ENABLED}}/true/g" "${INSTANCE_DIR}/.env"
        sed -i "s/{{WECOM_ENABLED}}/false/g" "${INSTANCE_DIR}/.env"
        # 解析并设置钉钉配置
        if [ -n "$CHANNEL_CONFIG" ]; then
            CLIENT_ID=$(echo "$CHANNEL_CONFIG" | jq -r '.clientId')
            CLIENT_SECRET=$(echo "$CHANNEL_CONFIG" | jq -r '.clientSecret')
            sed -i "s/{{DINGTALK_CLIENT_ID}}/${CLIENT_ID}/g" "${INSTANCE_DIR}/.env"
            sed -i "s/{{DINGTALK_CLIENT_SECRET}}/${CLIENT_SECRET}/g" "${INSTANCE_DIR}/.env"
        fi
        ;;
    "wecom")
        sed -i "s/{{CHANNEL_TYPE}}/wecom/g" "${INSTANCE_DIR}/railway.toml"
        sed -i "s/{{FEISHU_ENABLED}}/false/g" "${INSTANCE_DIR}/.env"
        sed -i "s/{{DINGTALK_ENABLED}}/false/g" "${INSTANCE_DIR}/.env"
        sed -i "s/{{WECOM_ENABLED}}/true/g" "${INSTANCE_DIR}/.env"
        ;;
    *)
        echo "不支持的通道类型: ${CHANNEL_TYPE}"
        exit 1
        ;;
esac

# 生成唯一 Token
UNIQUE_TOKEN=$(openssl rand -hex 32)
sed -i "s/{{GATEWAY_TOKEN}}/${UNIQUE_TOKEN}/g" "${INSTANCE_DIR}/.env"

echo "✅ 实例目录已创建: ${INSTANCE_DIR}"
echo ""
echo "下一步:"
echo "1. 编辑 ${INSTANCE_DIR}/.env 确认配置"
echo "2. 运行 ./scripts/deploy-instance.sh ${INSTANCE_NAME}"
```

### 4.2 部署实例脚本

```bash
#!/bin/bash
# scripts/deploy-instance.sh
# 用法: ./deploy-instance.sh <实例名称>

set -e

INSTANCE_NAME=$1

if [ -z "$INSTANCE_NAME" ]; then
    echo "用法: ./deploy-instance.sh <实例名称>"
    exit 1
fi

INSTANCE_DIR="instances/${INSTANCE_NAME}"

if [ ! -d "$INSTANCE_DIR" ]; then
    echo "❌ 实例不存在: ${INSTANCE_NAME}"
    exit 1
fi

echo "=== 部署实例: ${INSTANCE_NAME} ==="

cd "$INSTANCE_DIR"

# 检查是否已登录 Railway
if ! railway whoami &>/dev/null; then
    echo "请先登录 Railway:"
    railway login
fi

# 检查项目是否存在，不存在则创建
if ! railway status &>/dev/null; then
    echo "创建新 Railway 项目..."
    railway init --name "$INSTANCE_NAME"
fi

# 加载环境变量
echo "加载环境变量..."
set -a
source .env
set +a

# 部署
echo "开始部署..."
railway up

echo ""
echo "✅ 部署完成!"
echo ""
echo "实例信息:"
railway domain 2>/dev/null || echo "域名: 请在 Railway Dashboard 查看"
echo ""
echo "查看日志: railway logs"
echo "打开控制台: railway open"
```

### 4.3 列出所有实例

```bash
#!/bin/bash
# scripts/list-instances.sh

echo "=== OpenClaw 实例列表 ==="
echo ""

if [ -d "instances" ]; then
    for instance in instances/*/; do
        name=$(basename "$instance")
        if [ -f "${instance}.env" ]; then
            channel=$(grep "CHANNEL_TYPE" "${instance}.env" 2>/dev/null | cut -d'=' -f2 || echo "unknown")
            status=$(cd "$instance" && railway status 2>/dev/null || echo "未部署")
            echo "📦 ${name}"
            echo "   通道: ${channel}"
            echo "   状态: ${status}"
            echo ""
        fi
    done
else
    echo "暂无实例"
fi
```

---

## 5. 新用户部署流程

### 5.1 准备工作

1. **获取用户信息**:
   - 用户名（用于标识实例）
   - 通道类型（飞书/钉钉/企业微信）
   - 通道配置（AppID、AppSecret 等）

2. **确认 Railway 配额**:
   ```bash
   railway whoami
   railway status
   ```

### 5.2 一键部署

#### 方式一：使用脚本

```bash
# 进入项目目录
cd moltbot-railway

# 创建新用户实例
./scripts/create-instance.sh zhangsan feishu '{
  "appId": "cli_a90b00a3bd799cb1",
  "appSecret": "LPjfXz3MxIlkLzsZOwXJIfVht0il4gEj"
}'

# 部署实例
./scripts/deploy-instance.sh openclaw-zhangsan-feishu
```

#### 方式二：手动配置

```bash
# 1. 创建实例目录
mkdir -p instances/openclaw-zhangsan-feishu

# 2. 复制模板
cp templates/railway.template.toml instances/openclaw-zhangsan-feishu/railway.toml
cp templates/env.template instances/openclaw-zhangsan-feishu/.env

# 3. 编辑配置
nano instances/openclaw-zhangsan-feishu/.env
# 修改:
# - FEISHU_APP_ID=cli_xxxxx
# - FEISHU_APP_SECRET=xxxxx
# - GATEWAY_TOKEN=生成唯一token

# 4. 部署
cd instances/openclaw-zhangsan-feishu
railway init --name openclaw-zhangsan-feishu
railway up
```

### 5.3 验证部署

```bash
# 查看日志
railway logs --follow

# 检查服务状态
curl https://openclaw-zhangsan-feishu.up.railway.app/health

# 测试通道连接
# 在飞书中发送消息测试
```

---

## 6. 实例管理

### 6.1 常用命令

```bash
# 列出所有实例
./scripts/list-instances.sh

# 查看实例日志
cd instances/openclaw-zhangsan-feishu
railway logs --follow

# 重启实例
railway restart

# 停止实例
railway down

# 删除实例
railway delete
```

### 6.2 更新实例

```bash
# 更新代码（从模板同步）
cd instances/openclaw-zhangsan-feishu
cp ../../openclaw-main/Dockerfile.railway ./Dockerfile
cp ../../openclaw-main/fix-plugin-config.sh .

# 重新部署
railway up
```

### 6.3 监控实例

```bash
# 查看资源使用
railway metrics

# 查看部署历史
railway status

# 设置告警（在 Railway Dashboard）
# Settings -> Alerts -> Add Alert
```

---

## 7. 配置模板

### 7.1 railway.template.toml

```toml
# OpenClaw Railway 部署配置 - {{INSTANCE_NAME}}

[build]
  builder = "dockerfile"
  dockerfilePath = "Dockerfile.railway"
  context = "../openclaw-main"  # 指向模板代码

  [build.args]
  CACHE_BUST = "{{CACHE_BUST}}"

[deploy]
  startCommand = "bash -c '/app/fix-plugin-config.sh && node dist/index.js gateway --allow-unconfigured --auth token --bind lan --port ${PORT:-8080}'"
  restartPolicyType = "always"
  restartPolicyMaxRetries = 10

[env]
  NODE_ENV = "production"
  RAILWAY_ENVIRONMENT = "production"
  MODEL_NAME = "openrouter/stepfun/step-3.5-flash:free"
  
  # 通道配置（从 .env 加载）
  FEISHU_ENABLED = "{{FEISHU_ENABLED}}"
  DINGTALK_ENABLED = "{{DINGTALK_ENABLED}}"
  WECOM_ENABLED = "{{WECOM_ENABLED}}"
  
  # Gateway 配置
  GATEWAY_AUTH_MODE = "token"
  OPENCLAW_GATEWAY_TOKEN = "{{GATEWAY_TOKEN}}"
  GATEWAY_BIND = "lan"
  DM_SCOPE = "per-peer"
  
  # WebSocket 配置
  GATEWAY_WEBSOCKET_TIMEOUT = "3600000"
  GATEWAY_WEBSOCKET_MAX_CONNECTIONS = "100"
  GATEWAY_WEBSOCKET_HEARTBEAT = "30000"
  
  # 资源限制
  GATEWAY_RATE_LIMIT = "200/minute"
  GATEWAY_CONCURRENT_CONNECTIONS = "100"
  
  # 技能配置
  OPENCLAW_SKILLS_AUTO_INSTALL = "false"
  OPENCLAW_BROWSER_ENABLED = "true"
```

### 7.2 env.template

```bash
# {{INSTANCE_NAME}} 环境变量配置
# 用户: {{USERNAME}}
# 创建时间: {{CREATE_TIME}}

# === 通道开关 ===
FEISHU_ENABLED={{FEISHU_ENABLED}}
DINGTALK_ENABLED={{DINGTALK_ENABLED}}
WECOM_ENABLED={{WECOM_ENABLED}}
TELEGRAM_ENABLED=false
DISCORD_ENABLED=false
SLACK_ENABLED=false

# === 飞书配置 ===
FEISHU_APP_ID={{FEISHU_APP_ID}}
FEISHU_APP_SECRET={{FEISHU_APP_SECRET}}

# === 钉钉配置 ===
DINGTALK_CLIENT_ID={{DINGTALK_CLIENT_ID}}
DINGTALK_CLIENT_SECRET={{DINGTALK_CLIENT_SECRET}}

# === 企业微信配置 ===
WECOM_CORP_ID={{WECOM_CORP_ID}}
WECOM_AGENT_ID={{WECOM_AGENT_ID}}
WECOM_SECRET={{WECOM_SECRET}}

# === Gateway 认证 ===
GATEWAY_TOKEN={{GATEWAY_TOKEN}}

# === AI 模型 ===
MODEL_NAME=openrouter/stepfun/step-3.5-flash:free
# 或使用其他模型:
# MODEL_NAME=anthropic/claude-3.5-sonnet
# MODEL_NAME=openai/gpt-4o
```

---

## 8. 成本估算

### Railway 定价（2026年）

| 方案 | 实例数 | 每实例/月 | 总成本/月 |
|-----|-------|----------|----------|
| 单实例多通道 | 1 | ~$5-10 | $5-10 |
| 多实例（5用户） | 5 | ~$3-5 | $15-25 |
| 多实例（10用户） | 10 | ~$3-5 | $30-50 |

### 优化建议

1. **使用 Hobby 计划**: 每个实例 $5/月
2. **资源限制**: 限制 CPU/内存使用
3. **自动休眠**: 低流量时自动休眠
4. **共享数据库**: 多实例共享一个数据库

---

## 9. 下一步

1. ✅ 创建配置模板文件
2. ✅ 编写部署脚本
3. ⏳ 测试新实例部署
4. ⏳ 编写用户文档
5. ⏳ 设置监控告警

---

*最后更新: 2026年2月11日*
