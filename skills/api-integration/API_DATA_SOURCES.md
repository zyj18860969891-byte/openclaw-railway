# 专业数据源API配置参考
本文档汇总了API集成技能支持的所有专业数据源及其配置要求。

## 📊 API提供商总览

| 领域 | API提供商 | 主要功能 | 免费额度 | 申请地址 |
|------|-----------|----------|----------|----------|
| 金融 | Alpha Vantage | 股票、外汇、加密货币实时数据 | 5次/分钟 | alpha-vantage.com |
| 新闻 | NewsAPI | 全球新闻搜索和聚合 | 100次/天 | newsapi.org |
| 研究 | arXiv | 学术论文搜索 | 无限制 | arxiv.org |
| 研究 | PubMed | 生物医学文献 | 无限制 | pubmed.ncbi.nlm.nih.gov |
| 天气 | OpenWeatherMap | 实时天气和预报 | 60次/分钟 | openweathermap.org |
| 地理 | GeoNames | 地理数据、时区、坐标 | 无限制 | geonames.org |
| 健康 | OpenFDA | 药品、食品、医疗器械数据 | 无限制 | open.fda.gov |
| 加密 | CoinGecko | 加密货币价格、市场数据 | 10-50次/分钟 | coingecko.com |

## 🔑 环境变量配置

### 必需配置（根据使用的工具）

```bash
# 金融数据
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key

# 新闻数据  
NEWSAPI_API_KEY=your_newsapi_key

# 天气数据
OPENWEATHERMAP_API_KEY=your_openweathermap_key

# 地理数据
GEONAMES_USERNAME=your_geonames_username

# 加密货币数据
COINGECKO_API_KEY=your_coingecko_key  # 可选，有更高限制
```

### 配置示例 (.env文件)

```env
# API密钥配置
ALPHA_VANTAGE_API_KEY=demo
NEWSAPI_API_KEY=your_newsapi_key_here
OPENWEATHERMAP_API_KEY=your_openweather_key_here
GEONAMES_USERNAME=your_username_here
COINGECKO_API_KEY=your_coingecko_key_here
```

## 🛠️ 可用工具清单

### 金融领域 (FinanceAdapter)
1. `get_stock_quote` - 获取股票实时报价
2. `get_forex_exchange` - 获取外汇汇率
3. `get_crypto_price` - 获取加密货币价格

### 新闻领域 (NewsAdapter)
4. `search_news` - 搜索新闻文章
5. `get_top_headlines` - 获取头条新闻

### 研究领域 (ResearchAdapter)
6. `search_arxiv` - 搜索arXiv学术论文
7. `search_pubmed` - 搜索PubMed生物医学文献

### 天气领域 (WeatherAdapter)
8. `get_current_weather` - 获取当前天气
9. `get_weather_forecast` - 获取天气预报

### 地理领域 (GeoAdapter)
10. `search_locations` - 搜索地理位置
11. `get_timezone_info` - 获取时区信息

### 健康领域 (HealthAdapter)
12. `search_drug_info` - 搜索药品信息
13. `search_food_nutrition` - 搜索食品营养数据
14. `search_medical_devices` - 搜索医疗器械

### 加密货币领域 (CryptoAdapter)
15. `get_crypto_markets` - 获取加密货币市场数据
16. `get_crypto_trending` - 获取热门加密货币
17. `get_crypto_historical` - 获取历史价格数据

## 📝 配置步骤

1. **注册API账户** - 访问各提供商官网注册并获取API密钥
2. **配置环境变量** - 在Railway项目设置中添加对应的环境变量
3. **验证配置** - 运行 `node validate.js` 测试API连接
4. **部署更新** - 提交更改并重新部署

## ⚠️ 注意事项

- 各API提供商有不同的速率限制，请合理使用
- 部分API密钥需要付费订阅才能获得更高额度
- 建议在生产环境中设置合理的缓存策略
- 定期检查API密钥的有效性和额度使用情况

## 🔍 故障排除

### 常见问题

1. **API密钥无效**
   - 检查环境变量是否正确配置
   - 确认API密钥是否已激活
   - 验证密钥是否具有所需权限

2. **速率限制**
   - 减少请求频率
   - 启用缓存机制
   - 考虑升级API套餐

3. **网络连接问题**
   - 检查防火墙设置
   - 确认Railway出站连接正常
   - 验证API服务状态

## 📚 参考资源

- [Alpha Vantage文档](https://www.alphavantage.co/documentation/)
- [NewsAPI文档](https://newsapi.org/docs)
- [OpenWeatherMap文档](https://openweathermap.org/api)
- [GeoNames使用条款](http://www.geonames.org/export/terms-of-use.html)
- [OpenFDA文档](https://open.fda.gov/apis/)
- [CoinGecko API文档](https://www.coingecko.com/en/api)