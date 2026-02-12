#!/bin/bash
# 检查 Dockerfile 是否包含必要的 Python 依赖
# 用于确保新实例不会出现 Python 依赖缺失问题

set -e

echo "=== 检查 Dockerfile Python 依赖 ==="
echo ""

# 检查的文件列表
DOCKERFILES=(
    "Dockerfile"
    "Dockerfile.railway"
    "instances/cloudclawd2/Dockerfile.railway"
)

# 检查的依赖项
PYTHON_DEPS=(
    "python3"
    "python3-pip"
    "Pillow"
    "markdown"
    "pyyaml"
    "playwright"
    "playwright install chromium"
    "--break-system-packages"
)

MISSING_FILES=()
MISSING_DEPS=()

for dockerfile in "${DOCKERFILES[@]}"; do
    if [ ! -f "$dockerfile" ]; then
        echo "❌ 文件不存在: $dockerfile"
        MISSING_FILES+=("$dockerfile")
        continue
    fi
    
    echo "检查: $dockerfile"
    
    for dep in "${PYTHON_DEPS[@]}"; do
        if ! grep -q "$dep" "$dockerfile"; then
            echo "  ❌ 缺少: $dep"
            MISSING_DEPS+=("$dockerfile: $dep")
        else
            echo "  ✅ 找到: $dep"
        fi
    done
    echo ""
done

# 检查模板文件
echo "检查模板文件..."
if [ -f "templates/railway.template.toml" ]; then
    if grep -q "Dockerfile.railway" "templates/railway.template.toml"; then
        echo "✅ 模板文件指向 Dockerfile.railway"
    else
        echo "❌ 模板文件未指向 Dockerfile.railway"
    fi
fi

# 汇总结果
echo ""
echo "=== 检查结果 ==="
if [ ${#MISSING_FILES[@]} -eq 0 ] && [ ${#MISSING_DEPS[@]} -eq 0 ]; then
    echo "✅ 所有 Dockerfile 都包含必要的 Python 依赖"
    echo ""
    echo "未来创建新实例时，将自动使用包含 Python 依赖的 Dockerfile.railway"
    echo ""
    echo "新实例创建步骤:"
    echo "1. 复制 templates/railway.template.toml 到新实例目录"
    echo "2. 修改实例名称和配置"
    echo "3. 部署时会自动使用根目录的 Dockerfile.railway"
    echo "4. 新实例将包含所有 Python 依赖"
else
    echo "❌ 发现问题:"
    if [ ${#MISSING_FILES[@]} -gt 0 ]; then
        echo "缺失文件:"
        for file in "${MISSING_FILES[@]}"; do
            echo "  - $file"
        done
    fi
    if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
        echo "缺失依赖:"
        for dep in "${MISSING_DEPS[@]}"; do
            echo "  - $dep"
        done
    fi
    exit 1
fi