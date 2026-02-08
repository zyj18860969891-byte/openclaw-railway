#!/bin/bash

echo "=== 测试自动技能安装配置 ==="
echo "时间: $(date)"

# 创建临时目录
TEMP_DIR="/tmp/test-openclaw"
mkdir -p "$TEMP_DIR"

# 运行配置生成脚本
echo "=== 运行配置生成脚本 ==="
bash fix-plugin-config.sh

# 检查配置文件是否存在
CONFIG_FILE="/tmp/openclaw/openclaw.json"
if [ -f "$CONFIG_FILE" ]; then
    echo "✅ 配置文件已生成"
    
    # 检查是否包含自动技能安装配置
    echo "=== 检查自动技能安装配置 ==="
    if grep -q '"autoInstall": true' "$CONFIG_FILE"; then
        echo "✅ 自动技能安装已启用"
    else
        echo "❌ 自动技能安装未启用"
        exit 1
    fi
    
    if grep -q '"skills"' "$CONFIG_FILE"; then
        echo "✅ skills 配置存在"
        
        # 显示 skills 配置
        echo "=== Skills 配置内容 ==="
        grep -A 10 '"skills"' "$CONFIG_FILE"
    else
        echo "❌ skills 配置不存在"
        exit 1
    fi
    
    # 检查技能源配置
    if grep -q 'npx skills add' "$CONFIG_FILE"; then
        echo "✅ 技能源配置正确"
    else
        echo "❌ 技能源配置不正确"
        exit 1
    fi
    
    if grep -q 'https://skills.sh' "$CONFIG_FILE"; then
        echo "✅ 技能注册表配置正确"
    else
        echo "❌ 技能注册表配置不正确"
        exit 1
    fi
    
else
    echo "❌ 配置文件未生成"
    exit 1
fi

echo "=== 测试完成 ==="
echo "✅ 所有测试通过，自动技能安装配置已正确设置"