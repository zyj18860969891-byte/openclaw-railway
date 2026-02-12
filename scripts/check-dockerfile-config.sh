#!/bin/bash
# 检查所有 Dockerfile 的配置正确性
# 用于确保新实例部署时不会出现配置问题

set -e

echo "=== 检查所有 Dockerfile 配置 ==="
echo ""

# 检查的文件列表
DOCKERFILES=(
    "Dockerfile"
    "Dockerfile.railway"
    "instances/cloudclawd2/Dockerfile.railway"
)

# 检查的关键配置
CHECKS=(
    "python3"
    "python3-pip"
    "Pillow"
    "markdown"
    "pyyaml"
    "playwright"
    "playwright install chromium"
    "--break-system-packages"
    "CMD \[\"bash\", \"-c\""
    "${PORT:-8080}"
)

MISSING_FILES=()
MISSING_CONFIGS=()

for dockerfile in "${DOCKERFILES[@]}"; do
    if [ ! -f "$dockerfile" ]; then
        echo "❌ 文件不存在: $dockerfile"
        MISSING_FILES+=("$dockerfile")
        continue
    fi
    
    echo "检查: $dockerfile"
    
    for check in "${CHECKS[@]}"; do
        if ! grep -q "$check" "$dockerfile"; then
            echo "  ❌ 缺少: $check"
            MISSING_CONFIGS+=("$dockerfile: $check")
        else
            echo "  ✅ 找到: $check"
        fi
    done
    echo ""
done

# 检查模板文件
echo "检查模板文件..."
if [ -f "templates/railway.template.toml" ]; then
    if grep -q "dockerfilePath = \"Dockerfile.railway\"" "templates/railway.template.toml"; then
        echo "✅ 模板文件指向正确的 Dockerfile"
    else
        echo "❌ 模板文件未指向正确的 Dockerfile"
        MISSING_CONFIGS+=("templates/railway.template.toml: dockerfilePath")
    fi
fi

# 检查 CMD 格式
echo "检查 CMD 格式..."
for dockerfile in "${DOCKERFILES[@]}"; do
    if [ -f "$dockerfile" ]; then
        if grep -q 'CMD \["bash", "-c"' "$dockerfile"; then
            echo "✅ $dockerfile 使用 JSON 格式 CMD"
        else
            echo "❌ $dockerfile 未使用 JSON 格式 CMD"
            MISSING_CONFIGS+=("$dockerfile: CMD JSON format")
        fi
    fi
done

# 汇总结果
echo ""
echo "=== 检查结果 ==="
if [ ${#MISSING_FILES[@]} -eq 0 ] && [ ${#MISSING_CONFIGS[@]} -eq 0 ]; then
    echo "✅ 所有 Dockerfile 配置都正确"
    echo ""
    echo "配置验证通过："
    echo "1. ✅ Python 依赖已安装"
    echo "2. ✅ CMD 使用 JSON 格式"
    echo "3. ✅ 模板文件指向正确的 Dockerfile"
    echo "4. ✅ 环境变量 ${PORT:-8080} 已配置"
    echo ""
    echo "未来创建新实例时："
    echo "1. 使用 templates/railway.template.toml 作为配置模板"
    echo "2. 模板会自动使用根目录的 Dockerfile.railway"
    echo "3. Dockerfile.railway 包含所有必要的配置"
    echo "4. 新实例将自动包含 Python 依赖和正确的 CMD 格式"
else
    echo "❌ 发现问题:"
    if [ ${#MISSING_FILES[@]} -gt 0 ]; then
        echo "缺失文件:"
        for file in "${MISSING_FILES[@]}"; do
            echo "  - $file"
        done
    fi
    if [ ${#MISSING_CONFIGS[@]} -gt 0 ]; then
        echo "缺失配置:"
        for config in "${MISSING_CONFIGS[@]}"; do
            echo "  - $config"
        done
    fi
    exit 1
fi