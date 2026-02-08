// 完整的自动技能安装功能测试
import { execSync } from 'child_process';

// 模拟 processSkillNeeds 函数的核心逻辑
async function testAutoSkillInstall(message, workspaceDir) {
    console.log(`\n=== 测试消息: "${message}" ===`);
    
    // 1. 检测技能需求
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

    console.log(`检测到技能需求: [${detectedSkills.join(', ')}]`);

    // 2. 搜索技能
    for (const skillName of detectedSkills) {
        console.log(`\n--- 搜索技能: ${skillName} ---`);
        try {
            const searchCommand = `npx skills find ${skillName} --non-interactive`;
            const searchResult = execSync(searchCommand, { 
                encoding: 'utf8',
                timeout: 30000,
                stdio: 'pipe'
            });
            
            // 解析搜索结果
            const lines = searchResult.split('\n').filter(line => line.includes('@'));
            if (lines.length > 0) {
                const firstMatch = lines[0];
                const match = firstMatch.match(/([a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)@([a-zA-Z0-9_-]+)/);
                if (match) {
                    const [full, repository, skillName] = match;
                    console.log(`找到匹配技能: ${skillName} from ${repository}`);
                    
                    // 3. 检查是否已安装
                    const listCommand = `npx skills list`;
                    const listResult = execSync(listCommand, { encoding: 'utf8' });
                    const isInstalled = listResult.includes(skillName);
                    
                    if (isInstalled) {
                        console.log(`✅ 技能 ${skillName} 已安装`);
                    } else {
                        console.log(`❌ 技能 ${skillName} 未安装，可以自动安装`);
                        // 4. 模拟安装（不实际安装，只显示命令）
                        console.log(`安装命令: npx skills add ${repository}`);
                    }
                }
            } else {
                console.log(`未找到相关技能`);
            }
        } catch (error) {
            console.error(`搜索技能时出错: ${error.message}`);
        }
    }
}

// 运行测试
async function runTests() {
    console.log('=== 自动技能安装功能测试 ===');
    
    const testMessages = [
        "帮我生成一张图片",
        "今天天气怎么样？",
        "帮我看看GitHub仓库",
        "我需要写笔记",
        "我想用DALL-E生成图片"
    ];

    for (const message of testMessages) {
        await testAutoSkillInstall(message, ".");
    }
    
    console.log('\n=== 测试完成 ===');
}

runTests().catch(console.error);