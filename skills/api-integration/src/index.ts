import { UnifiedAPIClient } from './utils/unified-api-client';
import { FinanceAdapter } from './adapters/finance-adapter';
import { NewsAdapter } from './adapters/news-adapter';
import { ResearchAdapter } from './adapters/research-adapter';
import { WeatherAdapter } from './adapters/weather-adapter';
import { GeoAdapter } from './adapters/geo-adapter';
import { HealthAdapter } from './adapters/health-adapter';
import { CryptoAdapter } from './adapters/crypto-adapter';

class APIIntegrationSkill {
  private client: UnifiedAPIClient;
  private financeAdapter: FinanceAdapter;
  private newsAdapter: NewsAdapter;
  private researchAdapter: ResearchAdapter;
  private weatherAdapter: WeatherAdapter;
  private geoAdapter: GeoAdapter;
  private healthAdapter: HealthAdapter;
  private cryptoAdapter: CryptoAdapter;
  
  constructor() {
    this.client = new UnifiedAPIClient({
      cacheTTL: parseInt(process.env.API_CACHE_TTL || '300'),
      rateLimitDelay: parseFloat(process.env.API_RATE_LIMIT_DELAY || '1'),
      timeout: parseInt(process.env.API_TIMEOUT || '30000')
    });
    
    // 初始化适配器
    this.financeAdapter = new FinanceAdapter(this.client);
    this.newsAdapter = new NewsAdapter(this.client);
    this.researchAdapter = new ResearchAdapter(this.client);
    this.weatherAdapter = new WeatherAdapter(this.client);
    this.geoAdapter = new GeoAdapter(this.client);
    this.healthAdapter = new HealthAdapter(this.client);
    this.cryptoAdapter = new CryptoAdapter(this.client);
    this.newsAdapter = new NewsAdapter(this.client);
    this.researchAdapter = new ResearchAdapter(this.client);
    
    console.log('🚀 API集成技能初始化完成');
  }
  
  // 金融工具
  async getStockPrice(symbol: string) {
    try {
      const quote = await this.financeAdapter.getStockQuote(symbol);
      return {
        success: true,
        data: quote,
        message: `获取到 ${symbol} 股价: $${quote.price.toFixed(2)} (${quote.changePercent >= 0 ? '+' : ''}${quote.changePercent.toFixed(2)}%)`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `获取股价失败: ${error.message}`
      };
    }
  }
  
  async getStockHistory(symbol: string, days: number = 30) {
    try {
      const history = await this.financeAdapter.getHistoricalData(symbol, days);
      return {
        success: true,
        data: history,
        message: `获取到 ${symbol} 历史数据，共 ${history.length} 条记录`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `获取历史数据失败: ${error.message}`
      };
    }
  }
  
  // 新闻工具
  async searchNews(query: string, days: number = 7, maxResults: number = 20) {
    try {
      const articles = await this.newsAdapter.searchNews(query, days, maxResults);
      return {
        success: true,
        data: articles,
        message: `找到 ${articles.length} 篇关于 "${query}" 的新闻`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `搜索新闻失败: ${error.message}`
      };
    }
  }
  
  async getTopHeadlines(category: string = 'technology') {
    try {
      const articles = await this.newsAdapter.getTopHeadlines(category);
      return {
        success: true,
        data: articles,
        message: `获取到 ${category} 类别头条新闻 ${articles.length} 条`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `获取头条新闻失败: ${error.message}`
      };
    }
  }
  
  // 科研工具
  async searchPapers(query: string, maxResults: number = 10) {
    try {
      const papers = await this.researchAdapter.searchArxiv(query, maxResults);
      return {
        success: true,
        data: papers,
        message: `找到 ${papers.length} 篇关于 "${query}" 的学术论文`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `搜索论文失败: ${error.message}`
      };
    }
  }
  
  // 天气工具
  async getCurrentWeather(location: string, units: string = 'metric') {
    try {
      const weather = await this.weatherAdapter.getCurrentWeather(location, units);
      return {
        success: true,
        data: weather,
        message: `获取到 ${weather.location} 当前天气: ${weather.temperature}°${units === 'metric' ? 'C' : 'F'}, ${weather.description}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `获取天气失败: ${error.message}`
      };
    }
  }
  
  async getWeatherForecast(location: string, days: number = 3, units: string = 'metric') {
    try {
      const forecast = await this.weatherAdapter.getForecast(location, days, units);
      return {
        success: true,
        data: forecast,
        message: `获取到 ${forecast.location} 未来 ${days} 天天气预报`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `获取天气预报失败: ${error.message}`
      };
    }
  }
  
  async getAirQuality(lat: number, lon: number) {
    try {
      const aqi = await this.weatherAdapter.getAirQuality(lat, lon);
      return {
        success: true,
        data: aqi,
        message: `获取到空气质量指数: ${aqi.aqi} (${aqi.aqi_level})`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `获取空气质量失败: ${error.message}`
      };
    }
  }
  
  // 地理工具
  async geocodeAddress(address: string) {
    try {
      const results = await this.geoAdapter.geocode(address);
      if (results.length === 0) {
        return {
          success: false,
          error: '未找到该地址',
          message: '地址未找到'
        };
      }
      return {
        success: true,
        data: results[0],
        message: `地址 "${address}" 的坐标: ${results[0].lat}, ${results[0].lon}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `地理编码失败: ${error.message}`
      };
    }
  }
  
  async reverseGeocode(lat: number, lon: number) {
    try {
      const result = await this.geoAdapter.reverseGeocode(lat, lon);
      return {
        success: true,
        data: result,
        message: `坐标 (${lat}, ${lon}) 的地址: ${result.display_name}`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `反向地理编码失败: ${error.message}`
      };
    }
  }
  
  async searchNearbyPlaces(lat: number, lon: number, query: string, radius: number = 1000) {
    try {
      const results = await this.geoAdapter.searchNearby(lat, lon, query, radius);
      return {
        success: true,
        data: results,
        message: `在坐标 (${lat}, ${lon}) 附近找到 ${results.length} 个 "${query}" 相关地点`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `搜索附近地点失败: ${error.message}`
      };
    }
  }
  
  // 医疗健康工具
  async searchDrugs(query: string, limit: number = 10) {
    try {
      const drugs = await this.healthAdapter.searchDrugs(query, limit);
      return {
        success: true,
        data: drugs,
        message: `找到 ${drugs.length} 个与 "${query}" 相关的药物`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `搜索药物失败: ${error.message}`
      };
    }
  }
  
  async getNutritionInfo(food: string, limit: number = 5) {
    try {
      const foods = await this.healthAdapter.getNutritionInfo(food, limit);
      return {
        success: true,
        data: foods,
        message: `找到 ${foods.length} 个与 "${food}" 相关的食物营养信息`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `获取营养信息失败: ${error.message}`
      };
    }
  }
  
  async getCOVIDStats(country?: string) {
    try {
      const stats = await this.healthAdapter.getCOVIDStats(country);
      return {
        success: true,
        data: stats,
        message: country 
          ? `获取到 ${country} COVID-19 统计数据: ${stats.cases} 例确诊, ${stats.deaths} 例死亡`
          : `获取到全球COVID-19 统计数据: ${stats.cases} 例确诊, ${stats.deaths} 例死亡`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `获取COVID-19统计数据失败: ${error.message}`
      };
    }
  }
  
  // 加密货币工具
  async getCryptoPrices(ids: string[], vsCurrency: string = 'usd') {
    try {
      const prices = await this.cryptoAdapter.getCryptoPrices(ids, vsCurrency);
      return {
        success: true,
        data: prices,
        message: `获取到 ${prices.length} 个加密货币价格 (${vsCurrency})`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `获取加密货币价格失败: ${error.message}`
      };
    }
  }
  
  async getCryptoDetails(id: string) {
    try {
      const details = await this.cryptoAdapter.getCryptoDetails(id);
      return {
        success: true,
        data: details,
        message: `获取到 ${details.name} (${details.symbol}) 详细信息`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `获取加密货币详细信息失败: ${error.message}`
      };
    }
  }
  
  async getCryptoMarketData(vsCurrency: string = 'usd', limit: number = 100) {
    try {
      const marketData = await this.cryptoAdapter.getMarketData(vsCurrency, undefined, 'market_cap_desc', limit, 1);
      return {
        success: true,
        data: marketData,
        message: `获取到前 ${limit} 个加密货币市场数据 (${vsCurrency})`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `获取加密货币市场数据失败: ${error.message}`
      };
    }
  }
  
  async getCryptoHistoricalData(id: string, vsCurrency: string = 'usd', days: number = 30) {
    try {
      const historicalData = await this.cryptoAdapter.getHistoricalData(id, vsCurrency, days);
      return {
        success: true,
        data: historicalData,
        message: `获取到 ${id} 过去 ${days} 天历史价格数据`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `获取加密货币历史数据失败: ${error.message}`
      };
    }
  }
  
  async getTrendingCryptos(vsCurrency: string = 'usd') {
    try {
      const trending = await this.cryptoAdapter.getTrendingCoins(vsCurrency);
      return {
        success: true,
        data: trending,
        message: `获取到 ${trending.length} 个热门加密货币`
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        message: `获取热门加密货币失败: ${error.message}`
      };
    }
  }
  
  // 清理资源
  cleanup() {
    this.client.clearCache();
    console.log('✅ API集成技能资源已清理');
  }
}

// 导出技能实例
const skill = new APIIntegrationSkill();

const skillExport = {
  name: '@openclaw/api-integration',
  version: '1.0.0',
  description: '专业领域API集成技能，支持金融、新闻、科研、天气、地理、医疗、加密货币数据',
  tools: {
    // 金融工具
    'stock-price': async (params: any) => await skill.getStockPrice(params.symbol),
    'stock-history': async (params: any) => await skill.getStockHistory(params.symbol, params.days),
    
    // 新闻工具
    'news-search': async (params: any) => await skill.searchNews(params.query, params.days, params.maxResults),
    'news-headlines': async (params: any) => await skill.getTopHeadlines(params.category),
    
    // 科研工具
    'paper-search': async (params: any) => await skill.searchPapers(params.query, params.maxResults),
    
    // 天气工具
    'current-weather': async (params: any) => await skill.getCurrentWeather(params.location, params.units),
    'weather-forecast': async (params: any) => await skill.getWeatherForecast(params.location, params.days, params.units),
    'air-quality': async (params: any) => await skill.getAirQuality(params.lat, params.lon),
    
    // 地理工具
    'geocode': async (params: any) => await skill.geocodeAddress(params.address),
    'reverse-geocode': async (params: any) => await skill.reverseGeocode(params.lat, params.lon),
    'nearby-places': async (params: any) => await skill.searchNearbyPlaces(params.lat, params.lon, params.query, params.radius),
    
    // 医疗健康工具
    'drug-search': async (params: any) => await skill.searchDrugs(params.query, params.limit),
    'nutrition-info': async (params: any) => await skill.getNutritionInfo(params.food, params.limit),
    'covid-stats': async (params: any) => await skill.getCOVIDStats(params.country),
    
    // 加密货币工具
    'crypto-prices': async (params: any) => await skill.getCryptoPrices(params.ids, params.vsCurrency),
    'crypto-details': async (params: any) => await skill.getCryptoDetails(params.id),
    'crypto-market': async (params: any) => await skill.getCryptoMarketData(params.vsCurrency, params.limit),
    'crypto-history': async (params: any) => await skill.getCryptoHistoricalData(params.id, params.vsCurrency, params.days),
    'trending-cryptos': async (params: any) => await skill.getTrendingCryptos(params.vsCurrency)
  },
  skill
};

export default skillExport;