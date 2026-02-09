# AutoInstall 配置示例

## 增强的 AutoInstall 功能

经过改进，AutoInstall 现在可以：

✅ **验证技能可执行性**：检查仓库是否包含 `cmd.sh` 或 `cmd.bat`  
✅ **智能候选排序**：优先推荐有可执行文件的仓库  
✅ **自动回滚机制**：安装失败时自动尝试下一个候选  
✅ **安装后验证**：确保安装的技能真正可用  

## 配置选项

在 `config.json` 的 `skills` 部分添加以下配置：

```json
{
  "skills": {
    "autoInstall": true,
    "requireUserConfirmation": false,
    "maxPerSession": 3,
    "verifyExecutable": true,
    "fallbackToNextCandidate": true
  }
}
```

### 配置说明

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `autoInstall` | boolean | `false` | 启用自动安装功能 |
| `requireUserConfirmation` | boolean | `true` | 是否需要用户确认（仅对第一个候选） |
| `maxPerSession` | number | `3` | 每会话最多安装的技能数量 |
| `verifyExecutable` | boolean | `true` | 是否验证技能有可执行文件 |
| `fallbackToNextCandidate` | boolean | `true` | 安装失败时是否尝试下一个候选 |

## 工作流程

### 1. 用户发送消息
```
今天天气怎么样？
```

### 2. 系统检测到需要 `weather` 技能

### 3. 搜索技能（验证可执行性）
```
🔍 搜索 weather 技能...
找到 4 个候选：
1. steipete/clawdis@weather (❌ 无 cmd.sh)
2. erichowens/some_claude_skills@web-weather-creator (✅ 有 cmd.sh)
3. smithery/ai@weather (✅ 有 cmd.sh)
4. chandima/agent-skills@weather (❌ 无 cmd.sh)
```

### 4. 智能排序后尝试安装
```
🔄 尝试安装 weather 从 erichowens/some_claude_skills...
✅ 安装成功，可执行文件已验证
```

### 5. 如果第一个失败，自动尝试下一个
```
❌ 第一个候选安装失败
🔄 尝试下一个候选：smithery/ai@weather
✅ 安装成功
```

## 日志示例

### 成功情况
```
🔍 Verifying executability for 4 skill candidates...
✅ Verified: 2/4 have executables
🔄 Attempting to install weather from erichowens/some_claude_skills
✅ Successfully installed weather with executable
```

### 失败情况（所有候选都失败）
```
🔍 Verifying executability for 4 skill candidates...
✅ Verified: 0/4 have executables
❌ Failed to install weather from any candidate: repo1, repo2, repo3, repo4
```

## 手动部署备选方案

如果 AutoInstall 仍然失败，可以手动部署天气技能：

```bash
# 创建技能目录
mkdir -p ~/.openclaw/workspace/.agents/skills/weather

# 创建 SKILL.md
cat > ~/.openclaw/workspace/.agents/skills/weather/SKILL.md << 'EOF'
# Weather Skill

提供天气查询功能。

## 用法
```
天气 北京
weather London
```
EOF

# 创建 cmd.sh
cat > ~/.openclaw/workspace/.agents/skills/weather/cmd.sh << 'EOF'
#!/bin/bash
# 简单的天气查询脚本
CITY="$1"
if [ -z "$CITY" ]; then
  echo "请指定城市，如：天气 北京"
  exit 1
fi

# 使用 wttr.in 获取天气
curl "wttr.in/${CITY}?format=3"
EOF

chmod +x ~/.openclaw/workspace/.agents/skills/weather/cmd.sh
```

## 调试技巧

### 1. 查看 AutoInstall 日志
```bash
railway logs | grep -i "skill"
```

### 2. 手动测试技能搜索
```bash
npx skills find weather
```

### 3. 验证技能可执行性
```bash
# 检查已安装的技能
ls ~/.openclaw/workspace/.agents/skills/weather/
# 应该看到：SKILL.md, cmd.sh
```

### 4. 强制刷新技能快照
```bash
# 在 WebChat 中发送：
/refresh skills
```

## 故障排除

### 问题：AutoInstall 找不到合适的技能
**解决**：
- 检查网络连接
- 确认 `skills.sh` 仓库可访问
- 考虑手动部署关键技能

### 问题：安装了但没有可执行文件
**解决**：
- 系统会自动尝试下一个候选
- 可以手动部署一个可用的技能
- 检查仓库是否包含 `cmd.sh` 或 `cmd.bat`

### 问题：安装超时
**解决**：
- 增加超时时间（修改代码中的 `timeoutMs`）
- 检查网络速度
- 使用更稳定的仓库

## 最佳实践

1. **启用验证**：`verifyExecutable: true` 确保安装的技能真正可用
2. **启用回滚**：`fallbackToNextCandidate: true` 提高成功率
3. **限制数量**：`maxPerSession: 2-3` 避免安装过多技能
4. **用户确认**：生产环境建议 `requireUserConfirmation: false`

---

🎯 **现在 AutoInstall 应该能智能地找到并安装真正可用的技能了！**