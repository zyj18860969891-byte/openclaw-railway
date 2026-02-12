# 创建新实例指南 (cloudclawd3, cloudclawd4 等)

## 重要提醒

**所有新实例都必须使用包含 Python 依赖的 Dockerfile.railway，否则会出现技能执行失败问题。**

## 当前状态

### ✅ 已修复的问题
1. **主服务** (`Dockerfile`) - 已包含 Python 依赖
2. **cloudclawd2 服务** (`instances/cloudclawd2/Dockerfile.railway`) - 已包含 Python 依赖
3. **根目录 Dockerfile.railway** - 已包含 Python 依赖

### 📋 Python 依赖清单
- `python3` - Python 3 运行时
- `python3-pip` - Python 包管理器
- `Pillow` - 图像处理库
- `markdown` - Markdown 解析库
- `pyyaml` - YAML 配置解析库
- `playwright` - 浏览器自动化库
- `playwright install chromium` - 安装 Chromium 浏览器

## 创建新实例的正确步骤

### 方法一：使用模板（推荐）

1. **创建实例目录**
   ```bash
   mkdir -p instances/cloudclawd3
   ```

2. **复制模板配置**
   ```bash
   cp templates/railway.template.toml instances/cloudclawd3/railway.toml
   cp templates/env.template instances/cloudclawd3/.env
   ```

3. **编辑配置文件**
   ```bash
   # 编辑 instances/cloudclawd3/railway.toml
   # 修改实例名称、通道配置等
   
   # 编辑 instances/cloudclawd3/.env
   # 修改环境变量，特别是：
   # - GATEWAY_TOKEN (生成唯一token)
   # - FEISHU_APP_ID / FEISHU_APP_SECRET
   # - DINGTALK_CLIENT_ID / DINGTALK_CLIENT_SECRET
   ```

4. **部署到 Railway**
   ```bash
   cd instances/cloudclawd3
   railway init --name cloudclawd3
   railway up
   ```

### 方法二：复制现有实例

1. **复制 cloudclawd2 的配置**
   ```bash
   mkdir -p instances/cloudclawd3
   cp -r instances/cloudclawd2/* instances/cloudclawd3/
   ```

2. **修改配置**
   ```bash
   # 修改 railway.toml 中的实例名称
   # 修改 .env 中的环境变量
   ```

3. **部署**
   ```bash
   cd instances/cloudclawd3
   railway init --name cloudclawd3
   railway up
   ```

## 关键配置说明

### railway.toml 配置

```toml
[build]
  builder = "dockerfile"
  # 关键：指向根目录的 Dockerfile.railway
  dockerfilePath = "Dockerfile.railway"
  context = "."
```

**重要**：`dockerfilePath` 必须指向根目录的 `Dockerfile.railway`，而不是实例目录中的 Dockerfile。

### 环境变量配置

```toml
[env]
  # 确保使用正确的配置路径
  OPENCLAW_CONFIG_PATH = "/data/openclaw/openclaw.json"
  OPENCLAW_WORKSPACE_DIR = "/tmp/workspace"
  
  # 生成唯一的 Gateway Token
  OPENCLAW_GATEWAY_TOKEN = "your-unique-token-here"
```

## 验证部署

### 1. 检查构建日志
```bash
railway logs
```

查找以下关键信息：
- ✅ `python3` 和 `python3-pip` 安装成功
- ✅ `pip3 install` 命令执行成功
- ✅ `playwright install chromium` 执行成功

### 2. 测试技能执行
```bash
# 在飞书/钉钉中发送消息测试技能
```

### 3. 检查错误日志
如果出现以下错误，说明缺少 Python 依赖：
```
[tools] exec failed: Command exited with code 1
```

## 常见问题

### Q1: 为什么 cloudclawd2 会出现技能执行失败？
**A**: 因为 `instances/cloudclawd2/Dockerfile.railway` 缺少 Python 依赖安装步骤。

### Q2: 如何避免新实例出现同样问题？
**A**: 
1. 使用根目录的 `Dockerfile.railway`（模板已配置）
2. 确保 `dockerfilePath` 指向正确的文件
3. 部署前检查 Dockerfile 是否包含 Python 依赖

### Q3: 如果已经创建了实例但没有 Python 依赖怎么办？
**A**: 
1. 修改实例的 `railway.toml`，确保 `dockerfilePath = "Dockerfile.railway"`
2. 重新部署实例
3. Railway 会重新构建容器并包含 Python 依赖

## 检查脚本

运行以下脚本检查所有 Dockerfile 是否包含 Python 依赖：
```bash
./scripts/check-dockerfile-python-deps.sh
```

## 总结

✅ **安全创建新实例的要点**：
1. 使用 `templates/railway.template.toml` 作为配置模板
2. 确保 `dockerfilePath` 指向根目录的 `Dockerfile.railway`
3. 部署前验证 Dockerfile 包含 Python 依赖
4. 部署后检查日志确认 Python 依赖安装成功

这样创建的任何新实例（cloudclawd3, cloudclawd4 等）都不会出现 Python 依赖缺失的问题。