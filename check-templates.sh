#!/bin/bash

echo "=== 检查模板文件 ==="

# 检查模板目录是否存在
if [ -d "docs/reference/templates" ]; then
    echo "✅ 模板目录存在: docs/reference/templates"
else
    echo "❌ 模板目录不存在: docs/reference/templates"
    exit 1
fi

# 检查 IDENTITY.md 文件是否存在
if [ -f "docs/reference/templates/IDENTITY.md" ]; then
    echo "✅ IDENTITY.md 文件存在"
    echo "文件大小: $(wc -c < docs/reference/templates/IDENTITY.md) 字节"
else
    echo "❌ IDENTITY.md 文件不存在"
    exit 1
fi

# 列出模板目录中的所有文件
echo ""
echo "模板目录中的文件:"
ls -la docs/reference/templates/

# 检查文件内容
echo ""
echo "IDENTITY.md 文件内容预览:"
head -20 docs/reference/templates/IDENTITY.md

echo ""
echo "=== 模板文件检查完成 ==="