#!/usr/bin/env node

/**
 * API集成技能测试脚本
 * 测试各个API适配器的功能
 */

import { APIIntegrationSkill } from './index';

async function runTests() {
  console.log('🧪 开始API集成技能测试...\n');
  
  const skill = new APIIntegrationSkill();
  
  // 测试1: 股票价格查询
  console.log('📈 测试1: 股票价格查询');
  try {
    const result = await skill.getStockPrice('AAPL');
    console.log('结果:', result.success ? '✅ 成功' : '❌ 失败');
    if (result.success) {
      console.log(`股价: $${result.data.price} (${result.data.changePercent}%)`);
    } else {
      console.log('错误:', result.error);
    }
  } catch (error) {
    console.log('❌ 异常:', error);
  }
  console.log('');
  
  // 测试2: 新闻搜索
  console.log('📰 测试2: 新闻搜索');
  try {
    const result = await skill.searchNews('technology', 3, 5);
    console.log('结果:', result.success ? '✅ 成功' : '❌ 失败');
    if (result.success) {
      console.log(`找到 ${result.data.length} 篇新闻`);
      result.data.slice(0, 3).forEach((article: any, index: number) => {
        console.log(`  ${index + 1}. ${article.title}`);
      });
    } else {
      console.log('错误:', result.error);
    }
  } catch (error) {
    console.log('❌ 异常:', error);
  }
  console.log('');
  
  // 测试3: 学术论文搜索
  console.log('🔬 测试3: 学术论文搜索');
  try {
    const result = await skill.searchPapers('machine learning', 5);
    console.log('结果:', result.success ? '✅ 成功' : '❌ 失败');
    if (result.success) {
      console.log(`找到 ${result.data.length} 篇论文`);
      result.data.slice(0, 3).forEach((paper: any, index: number) => {
        console.log(`  ${index + 1}. ${paper.title}`);
      });
    } else {
      console.log('错误:', result.error);
    }
  } catch (error) {
    console.log('❌ 异常:', error);
  }
  console.log('');
  
  // 清理资源
  skill.cleanup();
  console.log('✅ 测试完成，资源已清理');
}

// 运行测试
runTests().catch(console.error);