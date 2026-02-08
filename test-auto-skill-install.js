// 简单的自动技能安装功能测试
const { detectSkillNeeds, searchSkills } = await import('./src/agents/auto-skill-install.js');

// 测试1: 检测技能需求
console.log('=== 测试1: 检测技能需求 ===');
const testMessages = [
    "帮我生成一张图片",
    "今天天气怎么样？",
    "帮我看看GitHub仓库",
    "我需要写笔记",
    "我想用DALL-E生成图片"
];

for (const message of testMessages) {
    const skills = detectSkillNeeds(message);
    console.log(`消息: "${message}" -> 检测到技能: [${skills.join(', ')}]`);
}

// 测试2: 搜索技能
console.log('\n=== 测试2: 搜索技能 ===');
try {
    const searchResults = await searchSkills("image");
    console.log(`搜索 "image" 找到 ${searchResults.length} 个技能:`);
    searchResults.slice(0, 3).forEach(skill => {
        console.log(`- ${skill.name}: ${skill.description} (${skill.repository})`);
    });
} catch (error) {
    console.log('搜索技能时出错:', error.message);
}

console.log('\n=== 测试完成 ===');