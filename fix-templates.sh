#!/bin/bash

echo "=== 修复模板文件问题 ==="

# 确保模板目录存在
mkdir -p /app/docs/reference/templates

# 复制模板文件
echo "复制模板文件..."
cp -r docs/reference/templates/* /app/docs/reference/templates/ 2>/dev/null || echo "复制模板文件时出错"

# 验证文件是否存在
echo "验证模板文件..."
if [ -f "/app/docs/reference/templates/IDENTITY.md" ]; then
    echo "✅ IDENTITY.md 文件存在"
    echo "文件大小: $(wc -c < /app/docs/reference/templates/IDENTITY.md) 字节"
    echo "文件内容预览:"
    head -10 /app/docs/reference/templates/IDENTITY.md
else
    echo "❌ IDENTITY.md 文件不存在"
    exit 1
fi

# 列出所有模板文件
echo ""
echo "所有模板文件:"
ls -la /app/docs/reference/templates/

echo ""
echo "=== 修复完成 ==="