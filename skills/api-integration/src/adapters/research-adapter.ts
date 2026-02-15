import { UnifiedAPIClient, APIProvider } from '../utils/unified-api-client';

export interface AcademicPaper {
  title: string;
  abstract: string;
  authors: string[];
  publishedDate: Date;
  updatedDate: Date;
  arxivId: string;
  pdfUrl: string;
  categories: string[];
  doi?: string;
  journal?: string;
}

export class ResearchAdapter {
  constructor(private client: UnifiedAPIClient) {
    // arXiv (无需认证)
    client.registerProvider({
      name: 'arxiv',
      baseURL: 'http://export.arxiv.org/api/query',
      authType: 'none',
      rateLimitPerMinute: 30
    } as APIProvider);
    
    // PubMed (无需认证)
    client.registerProvider({
      name: 'pubmed',
      baseURL: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils',
      authType: 'none',
      rateLimitPerMinute: 10
    } as APIProvider);
  }
  
  async searchArxiv(query: string, maxResults: number = 20, sortBy: 'relevance' | 'date' = 'date'): Promise<AcademicPaper[]> {
    const params = new URLSearchParams({
      search_query: `all:${query}`,
      start: '0',
      max_results: maxResults.toString(),
      sortBy: sortBy === 'date' ? 'submittedDate' : 'relevance',
      sortOrder: 'descending'
    });
    
    const url = `http://export.arxiv.org/api/query?${params.toString()}`;
    console.log(`🔬 搜索arXiv: ${query}`);
    
    try {
      // 使用原生https请求获取Atom feed
      const response = await this.client.request('arxiv', `?${params.toString()}`);
      return this.parseArxivResponse(response);
    } catch (error) {
      console.error('❌ arXiv搜索失败:', error);
      return [];
    }
  }
  
  private parseArxivResponse(response: any): AcademicPaper[] {
    // 注意：实际实现需要解析Atom XML格式
    // 这里提供一个简化的解析逻辑，实际使用时需要完整的XML解析
    try {
      // 如果响应是字符串，需要解析XML
      // 这里假设响应已经是解析后的对象（实际需要XML解析器）
      console.log('⚠️ arXiv响应需要XML解析，这里返回示例结构');
      return [];
    } catch (error) {
      console.error('❌ arXiv响应解析失败:', error);
      return [];
    }
  }
  
  async getArxivPaper(arxivId: string): Promise<AcademicPaper | null> {
    const params = new URLSearchParams({
      id_list: arxivId
    });
    
    try {
      const response = await this.client.request('arxiv', `?${params.toString()}`);
      const papers = this.parseArxivResponse(response);
      return papers[0] || null;
    } catch (error) {
      console.error(`❌ 获取arXiv论文 ${arxivId} 失败:`, error);
      return null;
    }
  }
  
  async searchPubmed(query: string, maxResults: number = 20): Promise<AcademicPaper[]> {
    // PubMed E-utilities API
    // 1. 搜索获取ID列表
    const searchUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi';
    const searchParams = new URLSearchParams({
      db: 'pubmed',
      term: query,
      retmax: maxResults.toString(),
      retmode: 'json'
    });
    
    try {
      const searchResult = await this.client.request('pubmed', `?${searchParams.toString()}`);
      const idList = searchResult.esearchresult.idlist;
      
      if (!idList || idList.length === 0) {
        return [];
      }
      
      // 2. 获取论文详情
      const fetchUrl = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi';
      const fetchParams = new URLSearchParams({
        db: 'pubmed',
        id: idList.join(','),
        retmode: 'xml'
      });
      
      const fetchResult = await this.client.request('pubmed', `?${fetchParams.toString()}`);
      return this.parsePubmedResponse(fetchResult);
      
    } catch (error) {
      console.error('❌ PubMed搜索失败:', error);
      return [];
    }
  }
  
  private parsePubmedResponse(response: any): AcademicPaper[] {
    // 注意：实际实现需要解析XML格式
    // 这里提供一个简化的解析逻辑
    try {
      console.log('⚠️ PubMed响应需要XML解析，这里返回示例结构');
      return [];
    } catch (error) {
      console.error('❌ PubMed响应解析失败:', error);
      return [];
    }
  }
}