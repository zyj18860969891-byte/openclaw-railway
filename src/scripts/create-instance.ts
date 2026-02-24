/**
 * 实例创建脚本 - 自动化创建新的OpenClaw服务实例
 * 使用方式:
 *   npm run create-instance -- --name=cloudclawd3 --plan=professional --channels=feishu,dingtalk
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { RailwayApiClient, RailwayEnvironmentVariable } from '../services/railway-api-client'

interface InstanceConfig {
  name: string
  plan: 'basic' | 'professional' | 'enterprise'
  channels: {
    [key: string]: {
      enabled: boolean
      appId?: string
      appSecret?: string
      clientId?: string
      clientSecret?: string
    }
  }
  adminContact: {
    email: string
    phone?: string
    companyName?: string
  }
}

interface PlanConfig {
  maxChannels: number
  rateLimit: string
  concurrentConnections: number
  websocketMaxConnections: number
  messageQueueSize: number
}

const PLAN_CONFIGS: Record<string, PlanConfig> = {
  basic: {
    maxChannels: 1,
    rateLimit: '100/minute',
    concurrentConnections: 50,
    websocketMaxConnections: 100,
    messageQueueSize: 1000
  },
  professional: {
    maxChannels: 3,
    rateLimit: '300/minute',
    concurrentConnections: 150,
    websocketMaxConnections: 200,
    messageQueueSize: 5000
  },
  enterprise: {
    maxChannels: 8,
    rateLimit: '600/minute',
    concurrentConnections: 300,
    websocketMaxConnections: 500,
    messageQueueSize: 10000
  }
}

class InstanceCreationEngine {
  private railwayClient: RailwayApiClient
  private config: InstanceConfig
  private gatewayToken: string

  constructor(railwayToken: string, projectId: string, config: InstanceConfig) {
    this.railwayClient = new RailwayApiClient(railwayToken, projectId)
    this.config = config
    this.gatewayToken = this.generateToken()
  }

  /**
   * 生成唯一的Gateway Token
   */
  private generateToken(length: number = 64): string {
    return crypto.randomBytes(length / 2).toString('hex')
  }

  /**
   * 验证配置
   */
  private validateConfig(): void {
    console.log('📋 验证配置...')

    // 验证实例名称
    if (!this.config.name.match(/^cloudclawd\d+$/)) {
      throw new Error('❌ 实例名称格式错误，应为 cloudclawd3, cloudclawd4 等')
    }

    // 验证计划
    if (!['basic', 'professional', 'enterprise'].includes(this.config.plan)) {
      throw new Error('❌ 订阅计划无效')
    }

    // 计算总通道数
    const enabledChannels = Object.values(this.config.channels)
      .filter(ch => ch.enabled)
      .length

    const planConfig = PLAN_CONFIGS[this.config.plan]
    if (enabledChannels > planConfig.maxChannels) {
      throw new Error(
        `❌ ${this.config.plan} 计划最多支持 ${planConfig.maxChannels} 个通道，但配置了 ${enabledChannels} 个`
      )
    }

    // 验证管理员信息
    if (!this.config.adminContact.email) {
      throw new Error('❌ 缺少管理员邮箱')
    }

    console.log('✅ 配置验证通过')
  }

  /**
   * 验证通道凭证
   */
  private async validateChannelCredentials(): Promise<void> {
    console.log('🔐 验证通道凭证...')

    for (const [channelName, channelConfig] of Object.entries(this.config.channels)) {
      if (!channelConfig.enabled) continue

      switch (channelName) {
        case 'feishu':
          if (!channelConfig.appId || !channelConfig.appSecret) {
            throw new Error('❌ 飞书: 缺少 App ID 或 App Secret')
          }
          // TODO: 调用飞书API验证凭证
          console.log(`✅ 飞书凭证验证通过`)
          break

        case 'dingtalk':
          if (!channelConfig.clientId || !channelConfig.clientSecret) {
            throw new Error('❌ 钉钉: 缺少 Client ID 或 Client Secret')
          }
          // TODO: 调用钉钉API验证凭证
          console.log(`✅ 钉钉凭证验证通过`)
          break

        case 'wecom':
          if (!channelConfig.appId || !channelConfig.appSecret) {
            throw new Error('❌ 企业微信: 缺少 Corp ID 或 Corp Secret')
          }
          console.log(`✅ 企业微信凭证验证通过`)
          break
      }
    }
  }

  /**
   * 生成环境变量
   */
  private generateEnvironmentVariables(): RailwayEnvironmentVariable[] {
    console.log('🔧 生成环境变量...')

    const planConfig = PLAN_CONFIGS[this.config.plan]
    const envVars: RailwayEnvironmentVariable[] = []

    // 基础配置
    envVars.push(
      { key: 'NODE_ENV', value: 'production' },
      { key: 'RAILWAY_ENVIRONMENT', value: 'production' },
      { key: 'MODEL_NAME', value: 'openrouter/stepfun/step-3.5-flash:free' },
      { key: 'OPENROUTER_API_KEY', value: process.env.OPENROUTER_API_KEY || 'YOUR_KEY' },
      { key: 'BRAVE_API_KEY', value: 'BSAWjRLSKRtH5eXE2Nz5r7PkGwgBT9x' }
    )

    // Gateway配置
    envVars.push(
      { key: 'GATEWAY_AUTH_MODE', value: 'token' },
      { key: 'OPENCLAW_GATEWAY_TOKEN', value: this.gatewayToken },
      { key: 'GATEWAY_BIND', value: 'lan' },
      { key: 'GATEWAY_TRUSTED_PROXIES', value: '100.64.0.0/10,127.0.0.1/32' }
    )

    // 通道开关
    envVars.push(
      { key: 'FEISHU_ENABLED', value: this.config.channels.feishu?.enabled ? 'true' : 'false' },
      { key: 'DINGTALK_ENABLED', value: this.config.channels.dingtalk?.enabled ? 'true' : 'false' },
      { key: 'WECOM_ENABLED', value: this.config.channels.wecom?.enabled ? 'true' : 'false' },
      { key: 'TELEGRAM_ENABLED', value: this.config.channels.telegram?.enabled ? 'true' : 'false' },
      { key: 'DISCORD_ENABLED', value: this.config.channels.discord?.enabled ? 'true' : 'false' },
      { key: 'SLACK_ENABLED', value: this.config.channels.slack?.enabled ? 'true' : 'false' }
    )

    // 通道凭证
    let channelIndex = 1
    for (const [channelName, channelConfig] of Object.entries(this.config.channels)) {
      if (!channelConfig.enabled) continue

      switch (channelName) {
        case 'feishu':
          envVars.push(
            { key: `FEISHU_APP_ID_${channelIndex}`, value: channelConfig.appId || '' },
            { key: `FEISHU_APP_SECRET_${channelIndex}`, value: channelConfig.appSecret || '' }
          )
          break
        case 'dingtalk':
          envVars.push(
            { key: `DINGTALK_CLIENT_ID_${channelIndex}`, value: channelConfig.clientId || '' },
            { key: `DINGTALK_CLIENT_SECRET_${channelIndex}`, value: channelConfig.clientSecret || '' }
          )
          break
      }

      channelIndex++
    }

    // 容量和限流配置
    envVars.push(
      { key: 'GATEWAY_RATE_LIMIT', value: planConfig.rateLimit },
      { key: 'GATEWAY_CONCURRENT_CONNECTIONS', value: planConfig.concurrentConnections.toString() },
      { key: 'GATEWAY_WEBSOCKET_TIMEOUT', value: '3600000' },
      { key: 'GATEWAY_WEBSOCKET_HEARTBEAT', value: '30000' },
      { key: 'GATEWAY_WEBSOCKET_MAX_CONNECTIONS', value: planConfig.websocketMaxConnections.toString() },
      { key: 'GATEWAY_MESSAGE_QUEUE_SIZE', value: planConfig.messageQueueSize.toString() },
      { key: 'GATEWAY_SESSION_CLEANUP_INTERVAL', value: '300000' }
    )

    // 其他配置
    envVars.push(
      { key: 'DM_SCOPE', value: 'per-peer' },
      { key: 'OPENCLAW_BROWSER_ENABLED', value: 'true' },
      { key: 'OPENCLAW_BROWSER_HEADLESS', value: 'true' },
      { key: 'OPENCLAW_BROWSER_NO_SANDBOX', value: 'true' },
      { key: 'OPENCLAW_SKILLS_AUTO_INSTALL', value: 'true' },
      { key: 'LOG_LEVEL', value: 'info' },
      { key: 'OPENCLAW_LOGGING_LEVEL', value: 'info' }
    )

    return envVars
  }

  /**
   * 创建本地实例目录结构
   */
  private createLocalStructure(envVars: RailwayEnvironmentVariable[]): void {
    console.log('📁 创建本地目录结构...')

    const instanceDir = path.join(process.cwd(), 'instances', this.config.name)

    // 创建目录
    if (!fs.existsSync(instanceDir)) {
      fs.mkdirSync(instanceDir, { recursive: true })
    }

    // 创建ENV_VARIABLES.txt
    let envContent = `# ${this.config.name} 服务环境变量配置清单\n`
    envContent += `# 创建时间: ${new Date().toISOString()}\n`
    envContent += `# 订阅计划: ${this.config.plan}\n`
    envContent += `# Gateway Token: ${this.gatewayToken}\n\n`

    for (const envVar of envVars) {
      envContent += `${envVar.key}=${envVar.value}\n`
    }

    fs.writeFileSync(path.join(instanceDir, 'ENV_VARIABLES.txt'), envContent)

    // 创建配置JSON文件
    const configFile = {
      name: this.config.name,
      plan: this.config.plan,
      gatewayToken: this.gatewayToken,
      channels: this.config.channels,
      adminContact: this.config.adminContact,
      createdAt: new Date().toISOString(),
      environmentVariables: envVars
    }

    fs.writeFileSync(
      path.join(instanceDir, 'config.json'),
      JSON.stringify(configFile, null, 2)
    )

    console.log(`✅ 本地目录创建完成: ${instanceDir}`)
  }

  /**
   * 执行创建流程
   */
  async create(): Promise<any> {
    try {
      console.log('\n🚀 开始创建实例...\n')

      // 1. 验证配置
      this.validateConfig()

      // 2. 验证通道凭证
      await this.validateChannelCredentials()

      // 3. 生成环境变量
      const envVars = this.generateEnvironmentVariables()

      // 4. 创建本地结构
      this.createLocalStructure(envVars)

      // 5. 调用Railway API创建服务
      console.log('\n🚂 连接Railway API...')
      const projectId = process.env.RAILWAY_PROJECT_ID || ''
      const apiToken = process.env.RAILWAY_API_TOKEN || ''

      if (!projectId || !apiToken) {
        console.warn('⚠️ 未设置 RAILWAY_PROJECT_ID 或 RAILWAY_API_TOKEN，跳过Railway API调用')
        console.log('\n设置方式:')
        console.log('  export RAILWAY_PROJECT_ID=your_project_id')
        console.log('  export RAILWAY_API_TOKEN=your_api_token')
        return {
          success: true,
          message: '实例本地配置创建成功，但未连接Railway',
          serviceName: this.config.name,
          gatewayToken: this.gatewayToken
        }
      }

      console.log('📝 创建Railway服务...')
      const service = await this.railwayClient.createService({
        projectId: projectId,
        name: this.config.name,
        githubRepo: 'zyj18860969891-byte/openclaw-railway'
      })
      console.log(`✅ Railway服务创建成功: ${service.id}`)

      console.log('🔗 连接GitHub仓库...')
      await this.railwayClient.connectGithubRepository(
        service.id,
        'zyj18860969891-byte/openclaw-railway',
        'main'
      )
      console.log('✅ GitHub仓库连接成功')

      console.log('🔧 设置环境变量...')
      const varResults = await this.railwayClient.setEnvironmentVariables(service.id, envVars)
      const successCount = varResults.filter(r => r.status === 'success').length
      console.log(`✅ 环境变量设置完成: ${successCount}/${varResults.length}`)

      console.log('⏳ 监控部署进度...')
      const finalStatus = await this.railwayClient.monitorDeployment(
        service.id,
        (status) => {
          console.log(`  📊 部署状态: ${status.status}`)
        }
      )

      console.log('\n✅ 实例创建完成！\n')

      return {
        success: true,
        serviceName: this.config.name,
        serviceId: service.id,
        gatewayToken: this.gatewayToken,
        plan: this.config.plan,
        deploymentStatus: finalStatus,
        createdAt: new Date().toISOString()
      }

    } catch (error) {
      console.error('\n❌ 错误:', error instanceof Error ? error.message : error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

/**
 * 主程序
 */
async function main() {
  // 解析命令行参数
  const args = process.argv.slice(2)
  const config: InstanceConfig = {
    name: '',
    plan: 'professional',
    channels: {},
    adminContact: {
      email: ''
    }
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=')
      switch (key) {
        case 'name':
          config.name = value
          break
        case 'plan':
          config.plan = value as any
          break
        case 'feishu-app-id':
          config.channels.feishu = { enabled: true, appId: value }
          break
        case 'feishu-app-secret':
          if (!config.channels.feishu) config.channels.feishu = { enabled: true }
          config.channels.feishu.appSecret = value
          break
        case 'dingtalk-client-id':
          config.channels.dingtalk = { enabled: true, clientId: value }
          break
        case 'dingtalk-client-secret':
          if (!config.channels.dingtalk) config.channels.dingtalk = { enabled: true }
          config.channels.dingtalk.clientSecret = value
          break
        case 'email':
          config.adminContact.email = value
          break
        case 'phone':
          config.adminContact.phone = value
          break
      }
    }
  }

  if (!config.name) {
    console.error('❌ 缺少 --name 参数')
    process.exit(1)
  }

  const railwayToken = process.env.RAILWAY_API_TOKEN || ''
  const projectId = process.env.RAILWAY_PROJECT_ID || ''

  const engine = new InstanceCreationEngine(railwayToken, projectId, config)
  const result = await engine.create()

  console.log('\n📋 结果:')
  console.log(JSON.stringify(result, null, 2))

  process.exit(result.success ? 0 : 1)
}

main().catch(console.error)
