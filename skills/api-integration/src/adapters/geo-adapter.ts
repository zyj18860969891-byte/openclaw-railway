import { UnifiedAPIClient } from '../utils/unified-api-client';

export class GeoAdapter {
  constructor(private client: UnifiedAPIClient) {
    // 注册OpenStreetMap Nominatim提供商
    client.registerProvider({
      name: 'nominatim',
      baseURL: 'https://nominatim.openstreetmap.org',
      authType: 'none',
      rateLimitPerMinute: 1 // Nominatim限制：每秒1次请求
    });
  }
  
  /**
   * 地理编码（地址转坐标）
   * @param address 地址
   * @param limit 结果数量限制
   */
  async geocode(address: string, limit: number = 1) {
    const endpoint = `/search?format=json&q=${encodeURIComponent(address)}&limit=${limit}&addressdetails=1`;
    
    try {
      const response = await this.client.request('nominatim', endpoint, {
        headers: {
          'User-Agent': process.env.GEO_USER_AGENT || 'OpenClaw/1.0'
        }
      });
      
      return response.map((item: any) => ({
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        display_name: item.display_name,
        address: item.address,
        type: item.type,
        importance: item.importance
      }));
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 反向地理编码（坐标转地址）
   * @param lat 纬度
   * @param lon 经度
   */
  async reverseGeocode(lat: number, lon: number) {
    const endpoint = `/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
    
    try {
      const response = await this.client.request('nominatim', endpoint, {
        headers: {
          'User-Agent': process.env.GEO_USER_AGENT || 'OpenClaw/1.0'
        }
      });
      
      return {
        lat: parseFloat(response.lat),
        lon: parseFloat(response.lon),
        display_name: response.display_name,
        address: response.address,
        type: response.type,
        osm_id: response.osm_id,
        osm_type: response.osm_type
      };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 获取地点详情
   * @param osmId OSM节点/道路/关系ID
   * @param osmType 类型（N/R/W）
   */
  async getPlaceDetails(osmId: number, osmType: 'N' | 'R' | 'W') {
    const userAgent = process.env.GEO_USER_AGENT || 'OpenClaw/1.0';
    const endpoint = `https://nominatim.openstreetmap.org/${osmType.toLowerCase()}/${osmId}.json`;
    
    try {
      const response = await this.client.request(endpoint, 'place-details', {
        headers: {
          'User-Agent': userAgent
        }
      });
      
      return {
        osm_id: response.osm_id,
        osm_type: response.osm_type,
        lat: parseFloat(response.lat),
        lon: parseFloat(response.lon),
        display_name: response.display_name,
        address: response.address,
        category: response.category,
        type: response.type
      };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 搜索附近地点
   * @param lat 纬度
   * @param lon 经度
   * @param query 搜索关键词
   * @param radius 搜索半径（米）
   */
  async searchNearby(lat: number, lon: number, query: string, radius: number = 1000) {
    const endpoint = `/search?format=json&q=${encodeURIComponent(query)}&viewbox=${lon-0.01},${lat+0.01},${lon+0.01},${lat-0.01}&bounded=1&limit=20`;
    
    try {
      const response = await this.client.request('nominatim', endpoint, {
        headers: {
          'User-Agent': process.env.GEO_USER_AGENT || 'OpenClaw/1.0'
        }
      });
      
      return response.map((item: any) => ({
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        display_name: item.display_name,
        distance: this.calculateDistance(lat, lon, parseFloat(item.lat), parseFloat(item.lon))
      }));
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 计算两点间距离（Haversine公式）
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // 地球半径（公里）
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  private toRad(deg: number): number {
    return deg * (Math.PI/180);
  }
  
  /**
   * 获取时区信息
   * @param lat 纬度
   * @param lon 经度
   */
  async getTimezone(lat: number, lon: number) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API密钥未配置，请设置GOOGLE_MAPS_API_KEY环境变量');
    }
    
    const endpoint = `https://maps.googleapis.com/maps/api/timezone/json?location=${lat},${lon}&timestamp=${Math.floor(Date.now()/1000)}&key=${apiKey}`;
    
    try {
      const response = await this.client.request(endpoint, 'timezone');
      return {
        timezone_id: response.timeZoneId,
        timezone_name: response.timeZoneName,
        dst_offset: response.dstOffset,
        raw_offset: response.rawOffset
      };
    } catch (error) {
      throw error;
    }
  }
}