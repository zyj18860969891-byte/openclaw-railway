#!/bin/bash
# 检查环境变量配置文件的正确性
# 用于验证 ENV_VARIABLES.txt 是否包含所有必要配置

set -e

echo "=== 检查环境变量配置文件 ==="
echo ""

# 检查的文件
ENV_FILES=(
    "instances/cloudclawd2/ENV_VARIABLES.txt"
    "templates/ENV_VARIABLES_TEMPLATE.md"
)

# 检查的必要环境变量
REQUIRED_VARS=(
    "NODE_ENV"
    "RAILWAY_ENVIRONMENT"
    "MODEL_NAME"
    "OPENROUTER_API_KEY"
    "GATEWAY_AUTH_MODE"
    "OPENCLAW_GATEWAY_TOKEN"
    "FEISHU_ENABLED"
    "DINGTALK_ENABLED"
    "WECOM_ENABLED"
    "TELEGRAM_ENABLED"
    "DISCORD_ENABLED"
    "SLACK_ENABLED"
    "FEISHU_APP_ID"
    "FEISHU_APP_SECRET"
    "DINGTALK_CLIENT_ID"
    "DINGTALK_CLIENT_SECRET"
    "GATEWAY_BIND"
    "GATEWAY_TRUSTED_PROXIES"
    "DM_SCOPE"
    "GATEWAY_WEBSOCKET_TIMEOUT"
    "GATEWAY_WEBSOCKET_MAX_CONNECTIONS"
    "GATEWAY_WEBSOCKET_HEARTBEAT"
    "GATEWAY_RATE_LIMIT"
    "GATEWAY_CONCURRENT_CONNECTIONS"
    "GATEWAY_MESSAGE_QUEUE_SIZE"
    "GATEWAY_SESSION_CLEANUP_INTERVAL"
    "OPENCLAW_BROWSER_ENABLED"
    "OPENCLAW_BROWSER_EXECUTABLE"
    "OPENCLAW_BROWSER_HEADLESS"
    "OPENCLAW_BROWSER_NO_SANDBOX"
    "OPENCLAW_SKILLS_AUTO_INSTALL"
    "OPENCLAW_SKILLS_REQUIRE_CONFIRMATION"
    "OPENCLAW_SKILLS_MAX_PER_SESSION"
    "LOG_LEVEL"
    "OPENCLAW_LOGGING_LEVEL"
    "OPENCLAW_STATE_DIR"
    "OPENCLAW_WORKSPACE_DIR"
    "OPENCLAW_CONFIG_PATH"
)

MISSING_FILES=()
MISSING_VARS=()

for env_file in "${ENV_FILES[@]}"; do
    if [ ! -f "$env_file" ]; then
        echo "❌ 文件不存在: $env_file"
        MISSING_FILES+=("$env_file")
        continue
    fi
    
    echo "检查: $env_file"
    
    for var in "${REQUIRED_VARS[@]}"; do
        if ! grep -q "^${var}=" "$env_file"; then
            echo "  ❌ 缺少: $var"
            MISSING_VARS+=("$env_file: $var")
        else
            echo "  ✅ 找到: $var"
        fi
    done
    echo ""
done

# 检查关键配置值
echo "检查关键配置值..."
for env_file in "${ENV_FILES[@]}"; do
    if [ -f "$env_file" ]; then
        echo "检查: $env_file"
        
        # 检查 OPENCLAW_WORKSPACE_DIR
        if grep -q "OPENCLAW_WORKSPACE_DIR=/tmp/workspace" "$env_file"; then
            echo "  ✅ OPENCLAW_WORKSPACE_DIR 正确"
        else
            echo "  ❌ OPENCLAW_WORKSPACE_DIR 应为 /tmp/workspace"
            MISSING_VARS+=("$env_file: OPENCLAW_WORKSPACE_DIR=/tmp/workspace")
        fi
        
        # 检查 OPENCLAW_CONFIG_PATH
        if grep -q "OPENCLAW_CONFIG_PATH=/data/openclaw/openclaw.json" "$env_file"; then
            echo "  ✅ OPENCLAW_CONFIG_PATH 正确"
        else
            echo "  ❌ OPENCLAW_CONFIG_PATH 应为 /data/openclaw/openclaw.json"
            MISSING_VARS+=("$env_file: OPENCLAW_CONFIG_PATH=/data/openclaw/openclaw.json")
        fi
        
        # 检查 GATEWAY_TRUSTED_PROXIES
        if grep -q "GATEWAY_TRUSTED_PROXIES=100.64.0.0/10,127.0.0.1/32" "$env_file"; then
            echo "  ✅ GATEWAY_TRUSTED_PROXIES 正确"
        else
            echo "  ⚠️  GATEWAY_TRUSTED_PROXIES 可能需要调整"
        fi
        echo ""
    fi
done

# 检查模板文件的占位符
echo "检查模板文件占位符..."
if [ -f "templates/ENV_VARIABLES_TEMPLATE.md" ]; then
    if grep -q "{{INSTANCE_NAME}}" "templates/ENV_VARIABLES_TEMPLATE.md"; then
        echo "✅ 模板文件包含占位符"
    else
        echo "❌ 模板文件缺少占位符"
    fi
fi

# 汇总结果
echo ""
echo "=== 检查结果 ==="
if [ ${#MISSING_FILES[@]} -eq 0 ] && [ ${#MISSING_VARS[@]} -eq 0 ]; then
    echo "✅ 所有环境变量配置文件都正确"
    echo ""
    echo "配置文件已准备好用于部署新服务："
    echo "1. 复制 templates/ENV_VARIABLES_TEMPLATE.md 到新实例目录"
    echo "2. 修改实例名称和 Token"
    echo "3. 填写用户凭证"
    echo "4. 部署到 Railway"
else
    echo "❌ 发现问题:"
    if [ ${#MISSING_FILES[@]} -gt 0 ]; then
        echo "缺失文件:"
        for file in "${MISSING_FILES[@]}"; do
            echo "  - $file"
        done
    fi
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        echo "缺失变量:"
        for var in "${MISSING_VARS[@]}"; do
            echo "  - $var"
        done
    fi
    exit 1
fi