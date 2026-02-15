import { UnifiedAPIClient } from '../utils/unified-api-client';

export class CryptoAdapter {
  constructor(private client: UnifiedAPIClient) {
    // 注册CoinGecko提供商
    client.registerProvider({
      name: 'coingecko',
      baseURL: 'https://api.coingecko.com/api/v3',
      authType: 'bearer',
      authHeader: 'x-cg-pro-api-key',
      authValue: process.env.COINGECKO_API_KEY,
      rateLimitPerMinute: 10 // 免费版本限制
    });
  }
  
  /**
   * 获取加密货币当前价格
   * @param ids 加密货币ID列表（CoinGecko格式）
   * @param vsCurrency 目标货币（usd, eur, cny等）
   */
  async getCryptoPrices(ids: string[], vsCurrency: string = 'usd') {
    const idsParam = ids.join(',');
    const endpoint = `/simple/price?ids=${idsParam}&vs_currencies=${vsCurrency}&include_24hr_change=true&include_market_cap=true`;
    
    try {
      const response = await this.client.request('coingecko', endpoint);
      
      return Object.entries(response).map(([id, data]: [string, any]) => ({
        id,
        symbol: id, // CoinGecko返回的数据中没有symbol，需要额外查询
        current_price: data[vsCurrency],
        market_cap: data[vsCurrency + '_market_cap'],
        price_change_24h: data[vsCurrency + '_24h_change'],
        price_change_percentage_24h: data[vsCurrency + '_24h_change']
      }));
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 获取加密货币详细信息
   * @param id 加密货币ID（CoinGecko格式）
   */
  async getCryptoDetails(id: string) {
    const endpoint = `/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    
    try {
      const response = await this.client.request('coingecko', endpoint);
      
      return {
        id: response.id,
        symbol: response.symbol,
        name: response.name,
        image: response.image?.large,
        current_price: response.market_data?.current_price,
        market_cap: response.market_data?.market_cap,
        market_cap_rank: response.market_data?.market_cap_rank,
        fully_diluted_valuation: response.market_data?.fully_diluted_valuation,
        total_volume: response.market_data?.total_volume,
        high_24h: response.market_data?.high_24h,
        low_24h: response.market_data?.low_24h,
        price_change_24h: response.market_data?.price_change_24h,
        price_change_percentage_24h: response.market_data?.price_change_percentage_24h,
        market_cap_change_24h: response.market_data?.market_cap_change_24h,
        market_cap_change_percentage_24h: response.market_data?.market_cap_change_percentage_24h,
        circulating_supply: response.market_data?.circulating_supply,
        total_supply: response.market_data?.total_supply,
        max_supply: response.market_data?.max_supply,
        last_updated: response.market_data?.last_updated
      };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 获取加密货币市场数据
   * @param vsCurrency 目标货币
   * @param category 分类（可选）
   * @param order 排序字段
   * @param perPage 每页数量
   * @param page 页码
   */
  async getMarketData(vsCurrency: string = 'usd', category?: string, order: string = 'market_cap_desc', perPage: number = 100, page: number = 1) {
    let endpoint = `/coins/markets?vs_currency=${vsCurrency}&order=${order}&per_page=${perPage}&page=${page}&sparkline=false`;
    
    if (category) {
      endpoint += `&category=${encodeURIComponent(category)}`;
    }
    
    try {
      const response = await this.client.request('coingecko', endpoint);
      
      return response.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        image: coin.image,
        current_price: coin.current_price,
        market_cap: coin.market_cap,
        market_cap_rank: coin.market_cap_rank,
        total_volume: coin.total_volume,
        high_24h: coin.high_24h,
        low_24h: coin.low_24h,
        price_change_24h: coin.price_change_24h,
        price_change_percentage_24h: coin.price_change_percentage_24h,
        circulating_supply: coin.circulating_supply,
        total_supply: coin.total_supply,
        max_supply: coin.max_supply,
        last_updated: coin.last_updated
      }));
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 获取加密货币历史价格
   * @param id 加密货币ID
   * @param vsCurrency 目标货币
   * @param days 天数
   * @param interval 间隔（daily, hourly）
   */
  async getHistoricalData(id: string, vsCurrency: string = 'usd', days: number = 30, interval: string = 'daily') {
    const endpoint = `/coins/${id}/market_chart?vs_currency=${vsCurrency}&days=${days}&interval=${interval}`;
    
    try {
      const response = await this.client.request('coingecko', endpoint);
      
      return {
        prices: response.prices.map((price: number[]) => ({
          timestamp: new Date(price[0]).toISOString(),
          price: price[1]
        })),
        market_caps: response.market_caps.map((cap: number[]) => ({
          timestamp: new Date(cap[0]).toISOString(),
          market_cap: cap[1]
        })),
        total_volumes: response.total_volumes.map((volume: number[]) => ({
          timestamp: new Date(volume[0]).toISOString(),
          volume: volume[1]
        }))
      };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 获取加密货币趋势（搜索趋势）
   * @param vsCurrency 目标货币
   */
  async getTrendingCoins(vsCurrency: string = 'usd') {
    const endpoint = `/search/trending`;
    
    try {
      const response = await this.client.request('coingecko', endpoint);
      
      return response.coins.map((item: any) => ({
        id: item.item.id,
        symbol: item.item.symbol,
        name: item.item.name,
        market_cap_rank: item.item.market_cap_rank,
        score: item.item.score
      }));
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 获取交易所信息
   * @param exchangeId 交易所ID
   */
  async getExchangeInfo(exchangeId: string) {
    const endpoint = `/exchanges/${exchangeId}`;
    
    try {
      const response = await this.client.request('coingecko', endpoint);
      
      return {
        id: response.id,
        name: response.name,
        year_established: response.year_established,
        country: response.country,
        description: response.description,
        url: response.url,
        image: response.image,
        has_trading_incentive: response.has_trading_incentive,
        trust_score: response.trust_score,
        trust_score_rank: response.trust_score_rank,
        trade_volume_24h_btc: response.trade_volume_24h_btc,
        trade_volume_24h_btc_normalized: response.trade_volume_24h_btc_normalized
      };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 获取全球加密货币市场数据
   */
  async getGlobalMarketData() {
    const endpoint = '/global';
    
    try {
      const response = await this.client.request('coingecko', endpoint);
      
      return {
        active_cryptocurrencies: response.data.active_cryptocurrencies,
        upcoming_icos: response.data.upcoming_icos,
        ongoing_icos: response.data.ongoing_icos,
        ended_icos: response.data.ended_icos,
        markets: response.data.markets,
        ico_week_stats: response.data.ico_week_stats,
        total_market_cap: response.data.total_market_cap,
        total_volume: response.data.total_volume,
        market_cap_percentage: response.data.market_cap_percentage,
        volume_change_percentage_24h: response.data.volume_change_percentage_24h,
        updated_at: new Date(response.data.updated_at * 1000).toISOString()
      };
    } catch (error) {
      throw error;
    }
  }
}