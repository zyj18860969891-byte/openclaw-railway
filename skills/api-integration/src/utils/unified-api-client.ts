import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import NodeCache from 'node-cache';
import dotenv from 'dotenv';

dotenv.config();

export interface APIConfig {
  cacheTTL?: number;
  rateLimitDelay?: number;
  timeout?: number;
  maxRetries?: number;
}

export interface APIProvider {
  name: string;
  baseURL: string;
  authType: 'bearer' | 'api-key' | 'none';
  authHeader?: string;
  authValue?: string;
  rateLimitPerMinute?: number;
}

export class UnifiedAPIClient {
  private client: AxiosInstance;
  private cache: NodeCache;
  private config: Required<APIConfig>;
  private providers: Map<string, APIProvider> = new Map();
  private requestTimes: number[] = [];
  
  constructor(config: APIConfig = {}) {
    this.config = {
      cacheTTL: config.cacheTTL || 300,
      rateLimitDelay: config.rateLimitDelay || 1000,
      timeout: config.timeout || 30000,
      maxRetries: config.maxRetries || 3
    };
    
    this.client = axios.create({
      timeout: this.config.timeout,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'OpenClaw/1.0 (API Integration Skill)'
      }
    });
    
    this.cache = new NodeCache({ stdTTL: this.config.cacheTTL });
    
    // 设置响应拦截器
    this.client.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 429) {
          console.log('⚠️ 速率限制，等待重试...');
          await this.delay(5000); // 等待5秒
          return this.client(error.config);
        }
        return Promise.reject(error);
      }
    );
  }
  
  registerProvider(provider: APIProvider): void {
    this.providers.set(provider.name, provider);
    console.log(`✅ 注册API提供商: ${provider.name}`);
  }
  
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    // 清理过期的请求时间记录
    this.requestTimes = this.requestTimes.filter(time => now - time < 60000);
    
    const provider = this.providers.get('default');
    const rateLimit = provider?.rateLimitPerMinute || 60;
    
    if (this.requestTimes.length >= rateLimit) {
      const oldest = this.requestTimes[0];
      const waitTime = 60000 - (now - oldest);
      if (waitTime > 0) {
        console.log(`⏳ 速率限制：等待 ${waitTime}ms`);
        await this.delay(waitTime);
      }
    }
    
    this.requestTimes.push(Date.now());
  }
  
  async request(providerName: string, endpoint: string, params: any = {}): Promise<any> {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`API提供商 ${providerName} 未注册`);
    }
    
    // 构建URL
    const url = `${provider.baseURL}${endpoint}`;
    
    // 生成缓存键
    const cacheKey = `${providerName}:${endpoint}:${JSON.stringify(params)}`;
    
    // 检查缓存
    const cached = this.cache.get<any>(cacheKey);
    if (cached) {
      console.log(`💾 使用缓存: ${providerName} ${endpoint}`);
      return cached;
    }
    
    // 速率限制
    await this.enforceRateLimit();
    
    // 准备请求配置
    const config: AxiosRequestConfig = {
      method: 'GET',
      url,
      params,
      headers: {}
    };
    
    // 添加认证
    if (provider.authType === 'bearer' && provider.authValue) {
      config.headers!.Authorization = `Bearer ${provider.authValue}`;
    } else if (provider.authType === 'api-key' && provider.authHeader && provider.authValue) {
      config.headers![provider.authHeader] = provider.authValue;
    }
    
    try {
      console.log(`🌐 请求: ${providerName} ${endpoint}`);
      const response: AxiosResponse = await this.client(config);
      const data = response.data;
      
      // 缓存成功响应
      this.cache.set(cacheKey, data);
      
      return data;
      
    } catch (error: any) {
      console.error(`❌ API请求失败 ${providerName} ${endpoint}:`, error.message);
      throw error;
    }
  }
  
  clearCache(): void {
    this.cache.close();
    console.log('✅ 缓存已清理');
  }
}