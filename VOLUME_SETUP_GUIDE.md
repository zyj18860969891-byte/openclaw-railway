# 📦 Volume 配置指南

## ❓ Volume 是什么？
Volume 不是环境变量，而是 Railway 提供的持久化存储功能。它允许你在服务重新部署后保留数据，比如：
- OpenClaw 的配置文件
- 会话数据
- 工作空间文件
- 用户数据

## 🔧 Volume 配置步骤

### 方法一：通过 Railway 控制台配置（推荐）

1. **打开 Railway 控制台**
   ```
   https://railway.app/
   ```

2. **选择你的项目**
   - 点击 `openclaw-railway` 项目

3. **进入 Service 设置**
   - 在左侧菜单中选择 `Service`
   - 选择 `openclaw-railway` 服务

4. **添加 Volume**
   - 找到 `Storage` 部分
   - 点击 `Add Volume`
   - 填写以下信息：
     ```
     Name: openclaw-data
     Mount Path: /data
     ```

5. **保存配置**
   - 点击保存按钮
   - Railway 会自动重新部署服务

### 方法二：通过 Railway CLI 配置

```bash
# 添加 Volume
railway volume:add openclaw-data --mount-path /data

# 查看已添加的 Volume
railway volume:list
```

## 🎯 Volume 的作用

### 1. 数据持久化
```bash
# Volume 挂载后，以下目录会被持久化：
/data/.openclaw/    # OpenClaw 配置和状态
/data/workspace/    # 工作空间文件
```

### 2. 环境变量配合使用
```bash
# 这些环境变量告诉 OpenClaw 使用 Volume 中的目录
OPENCLAW_STATE_DIR=/data/.openclaw
OPENCLAW_WORKSPACE_DIR=/data/workspace
```

### 3. 重新部署后数据不丢失
- 即使重新部署，Volume 中的数据仍然保留
- 配置文件、会话数据、工作空间文件都会被保存

## ✅ 验证 Volume 配置

### 1. 检查服务状态
```bash
railway status
```

### 2. 查看部署日志
```bash
railway logs
```

### 3. 访问 OpenClaw
- 设置向导：https://openclaw-railway-production-4678.up.railway.app/setup
- 控制界面：https://openclaw-railway-production-4678.up.railway.app/openclaw

## 🚨 注意事项

1. **Volume 名称必须唯一**
   - 不要使用已经存在的名称
   - 建议使用描述性的名称，如 `openclaw-data`

2. **挂载路径要正确**
   - `/data` 是 OpenClaw 期望的路径
   - 不要修改这个路径，除非你同时更新环境变量

3. **Volume 大小**
   - Railway 提供的默认存储空间通常足够
   - 如果需要更多空间，可能需要升级计划

4. **数据备份**
   - 定期备份数据
   - 可以通过 `/setup/export` 导出数据

## 🎉 完成后的状态

配置完成后，你应该看到：

### Railway 控制台
- ✅ HTTP Proxy 已启用（端口 8080）
- ✅ Volume 已添加（Name: `openclaw-data`, Mount Path: `/data`）
- ✅ 环境变量已设置

### OpenClaw 功能
- ✅ 设置向导可访问
- ✅ 控制界面可访问
- ✅ 数据持久化存储
- ✅ 配置在重新部署后保留

## 🔧 故障排除

### Volume 未挂载
```bash
# 检查 Volume 列表
railway volume:list

# 检查服务日志
railway logs
```

### 权限问题
- 确保 Volume 路径有正确的读写权限
- OpenClaw 运行在非 root 用户下

### 空间不足
- 清理不必要的数据
- 考虑升级 Railway 计划

---

**完成 Volume 配置后，你的 OpenClaw 实例就完全准备好了！** 🚀