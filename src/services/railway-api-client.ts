/**
 * Railway API 客户端
 * 用于自动化创建服务、设置环境变量、监控部署等
 */

import axios, { AxiosInstance } from 'axios'

export interface RailwayServiceConfig {
  projectId: string
  name: string
  githubRepo: string
  githubBranch?: string
}

export interface RailwayEnvironmentVariable {
  key: string
  value: string
}

export interface RailwayDeploymentStatus {
  status: 'building' | 'deploying' | 'success' | 'failed'
  progress?: number
  logs?: string[]
}

export class RailwayApiClient {
  private client: AxiosInstance
  private projectId: string
  private apiToken: string

  constructor(apiToken: string, projectId: string) {
    this.apiToken = apiToken
    this.projectId = projectId

    this.client = axios.create({
      baseURL: 'https://api.railway.app/graphql',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    })
  }

  /**
   * 创建新服务
   */
  async createService(config: RailwayServiceConfig) {
    const mutation = `
      mutation CreateService($projectId: String!, $name: String!) {
        serviceCreate(input: {
          projectId: $projectId
          name: $name
        }) {
          service {
            id
            name
            projectId
          }
        }
      }
    `

    const response = await this.client.post('', {
      query: mutation,
      variables: {
        projectId: config.projectId,
        name: config.name
      }
    })

    if (response.data.errors) {
      throw new Error(`创建服务失败: ${response.data.errors[0].message}`)
    }

    return response.data.data.serviceCreate.service
  }

  /**
   * 连接GitHub仓库
   */
  async connectGithubRepository(serviceId: string, repo: string, branch: string = 'main') {
    const mutation = `
      mutation ConnectGitRepo($serviceId: String!, $repo: String!, $branch: String!) {
        githubIntegrationServiceConnect(input: {
          serviceId: $serviceId
          repo: $repo
          branch: $branch
        }) {
          service {
            id
            name
          }
        }
      }
    `

    const response = await this.client.post('', {
      query: mutation,
      variables: {
        serviceId: serviceId,
        repo: repo,
        branch: branch
      }
    })

    if (response.data.errors) {
      throw new Error(`连接GitHub仓库失败: ${response.data.errors[0].message}`)
    }

    return response.data.data.githubIntegrationServiceConnect.service
  }

  /**
   * 批量设置环境变量
   */
  async setEnvironmentVariables(serviceId: string, variables: RailwayEnvironmentVariable[]) {
    const results = []

    for (const variable of variables) {
      const mutation = `
        mutation SetVariable($serviceId: String!, $key: String!, $value: String!) {
          variableSet(input: {
            serviceId: $serviceId
            key: $key
            value: $value
          }) {
            variable {
              id
              key
              value
            }
          }
        }
      `

      const response = await this.client.post('', {
        query: mutation,
        variables: {
          serviceId: serviceId,
          key: variable.key,
          value: variable.value
        }
      })

      if (response.data.errors) {
        console.error(`设置变量 ${variable.key} 失败: ${response.data.errors[0].message}`)
        results.push({
          key: variable.key,
          status: 'failed',
          error: response.data.errors[0].message
        })
      } else {
        results.push({
          key: variable.key,
          status: 'success'
        })
      }
    }

    return results
  }

  /**
   * 获取服务部署状态
   */
  async getDeploymentStatus(serviceId: string): Promise<RailwayDeploymentStatus> {
    const query = `
      query GetDeployment($serviceId: String!) {
        deployments(first: 1, input: {
          serviceId: $serviceId
        }) {
          edges {
            node {
              id
              status
              startedAt
              completedAt
            }
          }
        }
      }
    `

    const response = await this.client.post('', {
      query: query,
      variables: {
        serviceId: serviceId
      }
    })

    if (response.data.errors) {
      throw new Error(`获取部署状态失败: ${response.data.errors[0].message}`)
    }

    const deployment = response.data.data.deployments.edges[0]?.node
    if (!deployment) {
      return { status: 'failed', logs: ['未找到部署信息'] }
    }

    return {
      status: deployment.status,
      logs: []
    }
  }

  /**
   * 获取部署日志
   */
  async getDeploymentLogs(serviceId: string, limit: number = 100) {
    const query = `
      query GetDeploymentLogs($serviceId: String!) {
        deploymentLogs(input: {
          serviceId: $serviceId
          first: ${limit}
        }) {
          edges {
            node {
              id
              message
              timestamp
            }
          }
        }
      }
    `

    const response = await this.client.post('', {
      query: query,
      variables: {
        serviceId: serviceId
      }
    })

    if (response.data.errors) {
      console.error(`获取部署日志失败: ${response.data.errors[0].message}`)
      return []
    }

    return response.data.data.deploymentLogs.edges.map((edge: any) => edge.node.message)
  }

  /**
   * 监听部署进度（轮询）
   */
  async monitorDeployment(
    serviceId: string,
    onProgress?: (status: RailwayDeploymentStatus) => void,
    maxWaitTime: number = 600000 // 10分钟
  ): Promise<RailwayDeploymentStatus> {
    const startTime = Date.now()
    const pollInterval = 5000 // 每5秒查询一次

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const status = await this.getDeploymentStatus(serviceId)

          if (onProgress) {
            onProgress(status)
          }

          if (status.status === 'success') {
            resolve(status)
          } else if (status.status === 'failed') {
            reject(new Error('部署失败'))
          } else if (Date.now() - startTime > maxWaitTime) {
            reject(new Error('部署超时'))
          } else {
            setTimeout(poll, pollInterval)
          }
        } catch (error) {
          reject(error)
        }
      }

      poll()
    })
  }

  /**
   * 获取服务信息
   */
  async getService(serviceId: string) {
    const query = `
      query GetService($serviceId: String!) {
        service(id: $serviceId) {
          id
          name
          projectId
          createdAt
          domains {
            domain
            targetPort
            customDomain
          }
        }
      }
    `

    const response = await this.client.post('', {
      query: query,
      variables: {
        serviceId: serviceId
      }
    })

    if (response.data.errors) {
      throw new Error(`获取服务信息失败: ${response.data.errors[0].message}`)
    }

    return response.data.data.service
  }

  /**
   * 获取项目的所有服务
   */
  async listServices() {
    const query = `
      query ListServices($projectId: String!) {
        services(input: {
          projectId: $projectId
        }) {
          edges {
            node {
              id
              name
              createdAt
            }
          }
        }
      }
    `

    const response = await this.client.post('', {
      query: query,
      variables: {
        projectId: this.projectId
      }
    })

    if (response.data.errors) {
      throw new Error(`列出服务失败: ${response.data.errors[0].message}`)
    }

    return response.data.data.services.edges.map((edge: any) => edge.node)
  }

  /**
   * 删除服务
   */
  async deleteService(serviceId: string) {
    const mutation = `
      mutation DeleteService($serviceId: String!) {
        serviceDelete(input: {
          serviceId: $serviceId
        }) {
          service {
            id
          }
        }
      }
    `

    const response = await this.client.post('', {
      query: mutation,
      variables: {
        serviceId: serviceId
      }
    })

    if (response.data.errors) {
      throw new Error(`删除服务失败: ${response.data.errors[0].message}`)
    }

    return true
  }
}

/**
 * 使用示例
 */
export async function exampleUsage() {
  const client = new RailwayApiClient(
    process.env.RAILWAY_API_TOKEN || '',
    process.env.RAILWAY_PROJECT_ID || ''
  )

  try {
    // 1. 创建服务
    console.log('创建服务...')
    const service = await client.createService({
      projectId: process.env.RAILWAY_PROJECT_ID || '',
      name: 'cloudclawd3',
      githubRepo: 'zyj18860969891-byte/openclaw-railway'
    })
    console.log('✅ 服务创建成功:', service)

    // 2. 连接GitHub仓库
    console.log('连接GitHub仓库...')
    await client.connectGithubRepository(
      service.id,
      'zyj18860969891-byte/openclaw-railway',
      'main'
    )
    console.log('✅ GitHub仓库连接成功')

    // 3. 设置环境变量
    console.log('设置环境变量...')
    const envVars: RailwayEnvironmentVariable[] = [
      { key: 'NODE_ENV', value: 'production' },
      { key: 'FEISHU_ENABLED', value: 'true' },
      { key: 'FEISHU_APP_ID_1', value: 'cli_xxxxx' },
      { key: 'FEISHU_APP_SECRET_1', value: 'yyyyy' }
    ]
    const varResults = await client.setEnvironmentVariables(service.id, envVars)
    console.log('✅ 环境变量设置完成:', varResults)

    // 4. 监控部署
    console.log('监控部署进度...')
    const finalStatus = await client.monitorDeployment(
      service.id,
      (status) => {
        console.log(`部署状态: ${status.status}`)
      }
    )
    console.log('✅ 部署完成:', finalStatus)

  } catch (error) {
    console.error('❌ 错误:', error)
  }
}
