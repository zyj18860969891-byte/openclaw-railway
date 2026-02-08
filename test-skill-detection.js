// 简单的技能检测功能测试
// 复制 detectSkillNeeds 函数进行测试

function detectSkillNeeds(message) {
  const skillKeywords = {
    "image-gen": ["图片", "图像", "生成图片", "文生图", "draw", "image", "picture", "photo", "generate image", "create image"],
    "weather": ["天气", "weather", "forecast", "温度", "降雨", "气候"],
    "github": ["github", "仓库", "repository", "代码", "commit", "pull request"],
    "notion": ["notion", "笔记", "笔记软件", "document"],
    "openai-image-gen": ["dalle", "dall-e", "openai 图片", "GPT 图片"],
    "gemini": ["gemini", "google ai", "google 助手"],
  };

  const detectedSkills = [];
  const lowerMessage = message.toLowerCase();

  for (const [skillName, keywords] of Object.entries(skillKeywords)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        if (!detectedSkills.includes(skillName)) {
          detectedSkills.push(skillName);
        }
        break;
      }
    }
  }

  return detectedSkills;
}

// 测试技能检测
console.log('=== 技能检测测试 ===');
const testMessages = [
    "帮我生成一张图片",
    "今天天气怎么样？",
    "帮我看看GitHub仓库",
    "我需要写笔记",
    "我想用DALL-E生成图片",
    "帮我查一下明天的天气",
    "我想看看Google Gemini",
    "帮我创建一个Notion文档"
];

for (const message of testMessages) {
    const skills = detectSkillNeeds(message);
    console.log(`消息: "${message}" -> 检测到技能: [${skills.join(', ')}]`);
}

console.log('\n=== 测试完成 ===');