import { UnifiedAPIClient } from '../utils/unified-api-client';

export class HealthAdapter {
  constructor(private client: UnifiedAPIClient) {
    // 注册FDA API提供商
    client.registerProvider({
      name: 'fda',
      baseURL: 'https://api.fda.gov',
      authType: 'api-key',
      authHeader: 'api_key',
      authValue: process.env.OPENFDA_API_KEY,
      rateLimitPerMinute: 240 // FDA限制：每分钟240次请求
    });
    
    // 注册USDA API提供商
    client.registerProvider({
      name: 'usda',
      baseURL: 'https://api.nal.usda.gov/fdc/v1',
      authType: 'api-key',
      authHeader: 'api_key',
      authValue: process.env.USDA_API_KEY,
      rateLimitPerMinute: 100
    });
    
    // COVID-19 API（公开，无需认证）
    client.registerProvider({
      name: 'covid',
      baseURL: 'https://disease.sh/v3/covid-19',
      authType: 'none',
      rateLimitPerMinute: 60
    });
  }
  
  /**
   * 搜索药物信息（OpenFDA）
   * @param query 搜索关键词（药物名称）
   * @param limit 结果数量
   */
  async searchDrugs(query: string, limit: number = 10) {
    const endpoint = `/drug/label.json?search=${encodeURIComponent(query)}&limit=${limit}`;
    
    try {
      const response = await this.client.request('fda', endpoint);
      
      return response.results.map((drug: any) => ({
        id: drug.id,
        openfda: drug.openfda || {},
        manufacturer_name: drug.manufacturer_name || '未知',
        product_type: drug.product_type || '未知',
        generic_name: drug.openfda?.generic_name || [],
        brand_name: drug.openfda?.brand_name || [],
        indication: drug.indications_and_usage?.[0] || '',
        dosage: drug.dosage_and_administration?.[0] || '',
        warnings: drug.warnings?.[0] || '',
        adverse_reactions: drug.adverse_reactions?.[0] || ''
      }));
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }
  
  /**
   * 获取药物不良事件报告
   * @param drugName 药物名称
   * @param limit 结果数量
   */
  async getDrugAdverseEvents(drugName: string, limit: number = 10) {
    const endpoint = `/drug/event.json?search=patient.drug.medicinalproduct:${encodeURIComponent(drugName)}&limit=${limit}`;
    
    try {
      const response = await this.client.request('fda', endpoint);
      
      return response.results.map((event: any) => ({
        report_id: event.safetyreportid,
        patient: event.patient,
        seriousness: event.serious,
        outcome: event.patient?.outcome,
        drugs: event.patient?.drug?.map((drug: any) => ({
          name: drug.medicinalproduct,
          route: drug.route,
          dose: drug.dose
        })) || []
      }));
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }
  
  /**
   * 搜索疾病信息
   * @param query 疾病名称或症状
   * @param limit 结果数量
   */
  async searchDiseases(query: string, limit: number = 10) {
    const endpoint = `/device/event.json?search=product_problems:${encodeURIComponent(query)}&limit=${limit}`;
    
    try {
      const response = await this.client.request('fda', endpoint);
      
      return response.results || [];
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }
  
  /**
   * 获取营养信息（USDA FoodData Central）
   * @param food 食物名称
   * @param limit 结果数量
   */
  async getNutritionInfo(food: string, limit: number = 5) {
    const endpoint = `/foods/search?query=${encodeURIComponent(food)}&pageSize=${limit}`;
    
    try {
      const response = await this.client.request('usda', endpoint);
      
      return response.foods.map((food: any) => ({
        description: food.description,
        fdc_id: food.fdc_id,
        brand: food.brandOwner || '',
        nutrients: food.foodNutrients?.map((nutrient: any) => ({
          name: nutrient.nutrientName,
          value: nutrient.value,
          unit: nutrient.unitName
        })) || []
      }));
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 获取COVID-19统计数据（Johns Hopkins API）
   * @param country 国家（可选）
   */
  async getCOVIDStats(country?: string) {
    const endpoint = country 
      ? `/countries/${encodeURIComponent(country)}`
      : '/all';
    
    try {
      const response = await this.client.request('covid', endpoint);
      
      return {
        cases: response.cases,
        deaths: response.deaths,
        recovered: response.recovered,
        active: response.active,
        updated: new Date(response.updated).toISOString(),
        ...(country && {
          country: response.country,
          population: response.population,
          tests: response.tests,
          one_case_per_people: response.one_case_per_people,
          one_death_per_people: response.one_death_per_people
        })
      };
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * 获取医院信息（WHO API）
   * @param country 国家代码
   */
  async getHealthcareFacilities(country: string) {
    // 注意：WHO API可能需要特殊权限，这里使用模拟数据或替代方案
    // 实际实现可能需要使用其他医疗设施数据源
    throw new Error('医疗设施查询功能需要配置专用API，当前未实现');
  }
  
  /**
   * 症状检查器（基于症状的初步诊断建议）
   * @param symptoms 症状列表
   * @param gender 性别
   * @param yearOfBirth 出生年份
   */
  async symptomChecker(symptoms: string[], gender: string = 'male', yearOfBirth: number = 1990) {
    // 注意：这只是一个示例，实际症状检查器需要专业医疗API
    // 这里返回一个模拟响应，强调不能替代专业医疗建议
    
    return {
      warning: '此功能仅为示例，不能替代专业医疗建议。如有健康问题，请咨询医生。',
      symptoms,
      possible_conditions: [
        {
          condition: '示例条件',
          probability: 0.1,
          description: '这是一个示例响应，实际症状检查需要专业医疗API'
        }
      ],
      recommendation: '请咨询专业医疗人员获取准确诊断'
    };
  }
}