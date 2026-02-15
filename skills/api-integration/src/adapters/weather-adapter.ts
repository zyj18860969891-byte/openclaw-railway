import { UnifiedAPIClient } from '../utils/unified-api-client';

export class WeatherAdapter {
  constructor(private client: UnifiedAPIClient) {
    // 注册OpenWeatherMap提供商
    client.registerProvider({
      name: 'openweather',
      baseURL: 'https://api.openweathermap.org/data/2.5',
      authType: 'api-key',
      authHeader: 'appid',
      authValue: process.env.OPENWEATHER_API_KEY,
      rateLimitPerMinute: 60
    });
  }
  
  /**
   * 获取当前天气
   * @param location 位置（城市名或经纬度）
   * @param units 单位（metric/imperial）
   */
  async getCurrentWeather(location: string, units: string = 'metric') {
    // 判断location类型（城市名还是经纬度）
    const isCoordinates = /^-?\d+\.?\d*,-?\d+\.?\d*$/.test(location);
    let endpoint: string;
    
    if (isCoordinates) {
      const [lat, lon] = location.split(',');
      endpoint = `/weather?lat=${lat}&lon=${lon}&units=${units}`;
    } else {
      endpoint = `/weather?q=${encodeURIComponent(location)}&units=${units}`;
    }
    
    try {
      const response = await this.client.request('openweather', endpoint);
      return {
        location: response.name,
        country: response.sys.country,
        temperature: response.main.temp,
        feels_like: response.main.feels_like,
        humidity: response.main.humidity,
        pressure: response.main.pressure,
        wind_speed: response.wind.speed,
        wind_direction: response.wind.deg,
        description: response.weather[0].description,
        icon: response.weather[0].icon,
        visibility: response.visibility,
        cloudiness: response.clouds.all,
        sunrise: new Date(response.sys.sunrise * 1000).toISOString(),
        sunset: new Date(response.sys.sunset * 1000).toISOString(),
        timezone: response.timezone,
        timestamp: new Date(response.dt * 1000).toISOString()
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`位置 "${location}" 未找到`);
      }
      throw error;
    }
  }
  
  /**
   * 获取天气预报
   * @param location 位置
   * @param days 天数（1-5）
   * @param units 单位
   */
  async getForecast(location: string, days: number = 3, units: string = 'metric') {
    const endpoint = `/forecast?q=${encodeURIComponent(location)}&units=${units}&cnt=${days * 8}`; // 每天8个数据点
    
    try {
      const response = await this.client.request('openweather', endpoint);
      const forecasts = response.list.map((item: any) => ({
        datetime: new Date(item.dt * 1000).toISOString(),
        temperature: item.main.temp,
        feels_like: item.main.feels_like,
        humidity: item.main.humidity,
        pressure: item.main.pressure,
        wind_speed: item.wind.speed,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        pop: item.pop // 降水概率
      }));
      
      return {
        location: response.city.name,
        country: response.city.country,
        timezone: response.city.timezone,
        forecasts
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`位置 "${location}" 未找到`);
      }
      throw error;
    }
  }
  
  /**
   * 获取空气质量指数
   * @param lat 纬度
   * @param lon 经度
   */
  async getAirQuality(lat: number, lon: number) {
    const endpoint = `/air_pollution?lat=${lat}&lon=${lon}`;
    
    try {
      const response = await this.client.request('openweather', endpoint);
      const aqi = response.list[0].main.aqi;
      const components = response.list[0].components;
      
      return {
        aqi,
        aqi_level: this.getAQILevel(aqi),
        components: {
          co: components.co,
          no: components.no,
          no2: components.no2,
          o3: components.o3,
          so2: components.so2,
          pm2_5: components.pm2_5,
          pm10: components.pm10,
          nh3: components.nh3
        },
        timestamp: new Date(response.list[0].dt * 1000).toISOString()
      };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 获取天气预警
   * @param country 国家代码
   * @param lat 纬度（可选）
   * @param lon 经度（可选）
   */
  async getWeatherAlerts(country: string, lat?: number, lon?: number) {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenWeatherMap API密钥未配置，请设置OPENWEATHER_API_KEY环境变量');
    }
    
    let endpoint = `https://api.openweathermap.org/data/2.5/onecall?appid=${apiKey}`;
    if (lat && lon) {
      endpoint += `&lat=${lat}&lon=${lon}`;
    }
    endpoint += '&exclude=current,minutely,hourly,daily,alerts';
    
    try {
      const response = await this.client.request(endpoint, 'weather-alerts');
      return response.alerts || [];
    } catch (error) {
      throw error;
    }
  }
  
  private getAQILevel(aqi: number): string {
    if (aqi === 1) return '优秀';
    if (aqi === 2) return '良好';
    if (aqi === 3) return '中等';
    if (aqi === 4) return '较差';
    if (aqi === 5) return '很差';
    return '未知';
  }
}