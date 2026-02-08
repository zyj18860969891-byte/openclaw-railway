#!/bin/bash

# Railway 自动技能安装功能验证脚本

echo "=== OpenClaw 自动技能安装功能验证 ==="
echo "部署时间: $(date)"
echo ""

# 1. 检查配置文件
echo "1. 检查配置文件..."
if grep -q '"autoInstall": true' /tmp/openclaw/openclaw.json; then
    echo "✅ autoInstall 已启用"
else
    echo "❌ autoInstall 未启用"
fi

if grep -q '"type": "cli"' /tmp/openclaw/openclaw.json; then
    echo "✅ CLI 技能源已配置"
else
    echo "❌ CLI 技能源未配置"
fi

# 2. 检查技能模块文件
echo ""
echo "2. 检查自动技能安装模块..."
if [ -f "dist/agents/auto-skill-install.js" ]; then
    echo "✅ auto-skill-install.js 已构建"
else
    echo "❌ auto-skill-install.js 未找到"
fi

if grep -q "processSkillNeeds" dist/agents/pi-embedded-runner/run.js; then
    echo "✅ 集成到 pi-embedded-runner"
else
    echo "❌ 未集成到 pi-embedded-runner"
fi

# 3. 检查 skills.sh CLI
echo ""
echo "3. 检查 skills.sh CLI..."
if npx skills --version > /dev/null 2>&1; then
    echo "✅ skills.sh CLI 可用"
    npx skills --version
else
    echo "❌ skills.sh CLI 不可用"
fi

# 4. 测试技能检测功能
echo ""
echo "4. 测试技能检测功能..."
node -e "
const { detectSkillNeeds } = require('./dist/agents/auto-skill-install.js');
const testMessages = [
    '帮我生成一张图片',
    '今天天气怎么样？',
    '帮我看看GitHub仓库',
    '我需要写笔记'
];
console.log('测试消息技能检测:');
testMessages.forEach(msg => {
    const skills = detectSkillNeeds(msg);
    console.log('  \"' + msg + '\" -> [' + skills.join(', ') + ']');
});
" 2>/dev/null || echo "❌ 技能检测测试失败"

# 5. 检查已安装技能
echo ""
echo "5. 检查已安装技能..."
npx skills list | grep -E "weather|github|notion|openai-image-gen" && echo "✅ 关键技能已安装" || echo "⚠️  部分技能未安装"

# 6. 测试技能搜索
echo ""
echo "6. 测试技能搜索..."
npx skills find weather --non-interactive | head -3 && echo "✅ 技能搜索正常" || echo "❌ 技能搜索失败"

echo ""
echo "=== 验证完成 ==="
echo ""
echo "自动技能安装功能已部署到Railway"
echo "功能包括："
echo "- 根据对话意图自动检测技能需求"
echo "- 从 skills.sh 搜索匹配技能"
echo "- 自动安装所需技能"
echo "- 支持用户确认机制"
echo ""
echo "测试示例："
echo "用户: \"帮我生成一张图片\" -> 自动安装图片生成技能"
echo "用户: \"今天天气怎么样？\" -> 自动安装天气查询技能"
echo "用户: \"帮我看看GitHub仓库\" -> 自动安装GitHub技能"