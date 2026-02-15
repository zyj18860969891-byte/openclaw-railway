import { UnifiedAPIClient, APIProvider } from '../utils/unified-api-client';

export interface NewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  source: string;
  author: string;
  publishedAt: Date;
  category?: string;
}

export class NewsAdapter {
  constructor(private client: UnifiedAPIClient) {
    // NewsAPI
    client.registerProvider({
      name: 'newsapi',
      baseURL: 'https://newsapi.org/v2',
      authType: 'api-key',
      authHeader: 'X-API-Key',
      authValue: process.env.NEWSAPI_API_KEY,
      rateLimitPerMinute: 10
    } as APIProvider);
    
    // Currents
    client.registerProvider({
      name: 'currents',
      baseURL: 'https://api.currentsapi.services/v1',
      authType: 'api-key',
      authHeader: 'Authorization',
      authValue: `Bearer ${process.env.CURRENTS_API_KEY}`,
      rateLimitPerMinute: 20
    } as APIProvider);
  }
  
  async searchNews(query: string, daysBack: number = 7, maxResults: number = 20): Promise<NewsArticle[]> {
    try {
      const data = await this.client.request('newsapi', '/everything', {
        q: query,
        from: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        sortBy: 'publishedAt',
        language: 'en',
        pageSize: Math.min(maxResults, 100)
      });
      
      if (data.status !== 'ok') {
        throw new Error(data.message || 'NewsAPI请求失败');
      }
      
      return data.articles.map((article: any) => ({
        title: article.title,
        description: article.description,
        content: article.content || article.description,
        url: article.url,
        source: article.source?.name || 'Unknown',
        author: article.author || 'Unknown',
        publishedAt: new Date(article.publishedAt)
      }));
      
    } catch (error) {
      console.log('⚠️ NewsAPI失败，尝试Currents');
      return this.searchNewsCurrents(query, maxResults);
    }
  }
  
  private async searchNewsCurrents(query: string, limit: number = 50): Promise<NewsArticle[]> {
    const data = await this.client.request('currents', '/search', {
      keywords: query,
      limit,
      language: 'en'
    });
    
    if (!data.news) {
      throw new Error('Currents返回空数据');
    }
    
    return data.news.map((article: any) => ({
      title: article.title,
      description: article.description,
      content: article.content,
      url: article.url,
      source: article.source?.name || 'Currents',
      author: article.author || 'Unknown',
      publishedAt: new Date(article.published),
      category: article.category
    }));
  }
  
  async getTopHeadlines(category: string = 'technology', country: string = 'us'): Promise<NewsArticle[]> {
    const data = await this.client.request('newsapi', '/top-headlines', {
      category,
      country,
      pageSize: 20
    });
    
    if (data.status !== 'ok') {
      throw new Error(data.message || '获取头条新闻失败');
    }
    
    return data.articles.map((article: any) => ({
      title: article.title,
      description: article.description,
      content: article.content,
      url: article.url,
      source: article.source?.name || 'Unknown',
      author: article.author || 'Unknown',
      publishedAt: new Date(article.publishedAt)
    }));
  }
}