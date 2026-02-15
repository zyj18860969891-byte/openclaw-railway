import { UnifiedAPIClient, APIProvider } from '../utils/unified-api-client';

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: Date;
}

export interface HistoricalData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class FinanceAdapter {
  constructor(private client: UnifiedAPIClient) {
    // 注册Alpha Vantage提供商
    client.registerProvider({
      name: 'alphavantage',
      baseURL: 'https://www.alphavantage.co/query',
      authType: 'api-key',
      authHeader: 'apikey',
      authValue: process.env.ALPHA_VANTAGE_API_KEY,
      rateLimitPerMinute: 5 // 免费版本限制
    } as APIProvider);
    
    // Yahoo Finance不需要认证
    client.registerProvider({
      name: 'yahoo',
      baseURL: 'https://query1.finance.yahoo.com/v8/finance/chart/',
      authType: 'none',
      rateLimitPerMinute: 30
    } as APIProvider);
  }
  
  async getStockQuote(symbol: string): Promise<StockQuote> {
    // 优先使用Alpha Vantage
    try {
      const data = await this.client.request('alphavantage', '/', {
        function: 'GLOBAL_QUOTE',
        symbol
      });
      
      const quote = data['Global Quote'];
      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        timestamp: new Date(quote['07. latest trading day'])
      };
    } catch (error) {
      console.log('⚠️ Alpha Vantage失败，尝试Yahoo Finance');
      return this.getStockQuoteYahoo(symbol);
    }
  }
  
  private async getStockQuoteYahoo(symbol: string): Promise<StockQuote> {
    const data = await this.client.request('yahoo', `${symbol}?range=1d&interval=1d&includePrePost=false`);
    const result = data['chart']['result'][0];
    const meta = result.meta;
    const indicators = result.indicators.quote[0];
    
    return {
      symbol: meta.symbol,
      price: indicators.close[0] || 0,
      change: meta.regularMarketPrice - (indicators.open[0] || 0),
      changePercent: ((meta.regularMarketPrice - (indicators.open[0] || 0)) / (indicators.open[0] || 1)) * 100,
      volume: indicators.volume[0] || 0,
      timestamp: new Date(meta.regularMarketTime * 1000)
    };
  }
  
  async getHistoricalData(symbol: string, days: number = 30): Promise<HistoricalData[]> {
    const data = await this.client.request('yahoo', `${symbol}?range=${days}d&interval=1d&includePrePost=false`);
    const result = data['chart']['result'][0];
    const timestamps = result.timestamp;
    const indicators = result.indicators.quote[0];
    
    const historicalData: HistoricalData[] = timestamps.map((timestamp: number, index: number) => ({
      date: new Date(timestamp * 1000),
      open: indicators.open[index] || 0,
      high: indicators.high[index] || 0,
      low: indicators.low[index] || 0,
      close: indicators.close[index] || 0,
      volume: indicators.volume[index] || 0
    }));
    
    return historicalData;
  }
}