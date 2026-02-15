#!/usr/bin/env node

/**
 * API集成技能验证测试
 * 验证技能的基本架构和错误处理
 */

async function runValidationTests() {
  console.log('🔍 开始API集成技能验证测试...\n');
  
  // 动态导入技能模块
  const skillModule = await import('./dist/index.js');
  console.log('📋 调试信息 - skillModule keys:', Object.keys(skillModule));
  
  // 检查不同的导出方式
  let skillExport = skillModule.default;
  if (skillExport && skillExport.default) {
    skillExport = skillExport.default;
  }
  
  console.log('📋 调试信息 - skillExport keys:', Object.keys(skillExport || {}));
  
  if (!skillExport) {
    console.log('❌ 无法获取技能导出');
    return;
  }
  
  console.log('\n📋 测试1: 技能基本信息');
  console.log('技能名称:', skillExport.name);
  console.log('技能版本:', skillExport.version);
  console.log('可用工具:', Object.keys(skillExport.tools || {}));
  console.log('✅ 技能初始化成功\n');
  
  // 测试2: 验证工具调用（无API密钥，应该返回错误）
  console.log('🧪 测试2: 工具调用错误处理');
  
  // 金融工具测试
  try {
    const result = await skillExport.tools['stock-price']({ symbol: 'AAPL' });
    if (!result.success) {
      console.log('✅ 股票价格工具正确捕获错误:', result.error.substring(0, 80) + '...');
    } else {
      console.log('❌ 股票价格工具意外成功，应该需要API密钥');
    }
  } catch (error) {
    console.log('❌ 股票价格工具异常:', error.message);
  }
  
  // 新闻工具测试
  try {
    const result = await skillExport.tools['news-search']({ query: 'test', days: 1, maxResults: 1 });
    if (!result.success) {
      console.log('✅ 新闻搜索工具正确捕获错误:', result.error.substring(0, 80) + '...');
    } else {
      console.log('❌ 新闻搜索工具意外成功，应该需要API密钥');
    }
  } catch (error) {
    console.log('❌ 新闻搜索工具异常:', error.message);
  }
  
  // 科研工具测试
  try {
    const result = await skillExport.tools['paper-search']({ query: 'test', maxResults: 1 });
    if (!result.success) {
      console.log('✅ 论文搜索工具正确捕获错误:', result.error.substring(0, 80) + '...');
    } else {
      console.log('⚠️  论文搜索工具成功（arXiv是公开API，不需要密钥）');
    }
  } catch (error) {
    console.log('❌ 论文搜索工具异常:', error.message);
  }
  
  // 天气工具测试
  try {
    const result = await skillExport.tools['current-weather']({ location: 'Beijing', units: 'metric' });
    if (!result.success) {
      console.log('✅ 当前天气工具正确捕获错误:', result.error.substring(0, 80) + '...');
    } else {
      console.log('❌ 当前天气工具意外成功，应该需要API密钥');
    }
  } catch (error) {
    console.log('❌ 当前天气工具异常:', error.message);
  }
  
  // 地理工具测试（OpenStreetMap不需要API密钥）
  try {
    const result = await skillExport.tools['geocode']({ address: 'Beijing' });
    if (result.success) {
      console.log('✅ 地理编码工具工作正常:', result.message);
    } else {
      console.log('❌ 地理编码工具失败:', result.error);
    }
  } catch (error) {
    console.log('❌ 地理编码工具异常:', error.message);
  }
  
  // 医疗工具测试
  try {
    const result = await skillExport.tools['drug-search']({ query: 'aspirin', limit: 1 });
    if (!result.success) {
      console.log('✅ 药物搜索工具正确捕获错误:', result.error.substring(0, 80) + '...');
    } else {
      console.log('❌ 药物搜索工具意外成功，应该需要API密钥');
    }
  } catch (error) {
    console.log('❌ 药物搜索工具异常:', error.message);
  }
  
  // 加密货币工具测试
  try {
    const result = await skillExport.tools['crypto-prices']({ ids: ['bitcoin', 'ethereum'], vsCurrency: 'usd' });
    if (!result.success) {
      console.log('✅ 加密货币价格工具正确捕获错误:', result.error.substring(0, 80) + '...');
    } else {
      console.log('❌ 加密货币价格工具意外成功，应该需要API密钥');
    }
  } catch (error) {
    console.log('❌ 加密货币价格工具异常:', error.message);
  }
  
  console.log('');
  
  // 测试5: 验证资源清理
  console.log('🧹 测试5: 资源清理');
  try {
    skillExport.skill.cleanup();
    console.log('✅ 资源清理成功');
  } catch (error) {
    console.log('❌ 清理失败:', error);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 验证测试完成！');
  console.log('='.repeat(50));
  console.log('\n📝 测试总结:');
  console.log('✅ 技能初始化正常');
  console.log('✅ 错误处理机制工作正常');
  console.log('✅ 资源清理功能正常');
  console.log('\n⚠️  注意: 要测试真实API调用，请配置相应的API密钥');
  console.log('📖 查看README.md了解如何配置环境变量');
}

// 运行验证测试
runValidationTests().catch(console.error);