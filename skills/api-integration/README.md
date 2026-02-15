# @openclaw/api-integration

专业领域API集成技能，支持金融、新闻、科研、天气、地理、医疗、加密货币等多种API的集成和调用。

## 特性

- 🔄 **统一API客户端**: 统一的认证、缓存、错误处理、速率限制
- 📈 **金融数据**: 股票价格、历史数据（Alpha Vantage, Yahoo Finance）
- 📰 **新闻聚合**: 新闻搜索、头条新闻（NewsAPI, Currents）
- 🔬 **科研数据**: 学术论文搜索（arXiv, PubMed）
- 🌤️ **天气数据**: 当前天气、天气预报、空气质量（OpenWeatherMap）
- 🗺️ **地理信息**: 地理编码、反向地理编码、附近地点搜索（OpenStreetMap）
- 🏥 **医疗健康**: 药物信息、营养数据、COVID-19统计（OpenFDA, USDA）
- 💰 **加密货币**: 价格、市场数据、历史数据、趋势（CoinGecko）
- 🛡️ **健壮性**: 自动重试、降级策略、错误处理
- ⚡ **高性能**: 智能缓存、连接复用、速率限制
- 🔐 **安全性**: 环境变量配置、API密钥管理

## 安装

```bash
# 从本地安装
clawdbot plugins install ./skills/api-integration

# 或发布到NPM后安装
clawdbot plugins install @openclaw/api-integration
```

## 配置

1. 复制环境变量示例文件：
```bash
cp .env.example .env
```

2. 编辑 `.env` 文件，填入你的API密钥：
```env
# 至少配置一个金融API
ALPHA_VANTAGE_API_KEY=your_key_here
# 或
FINNHUB_API_KEY=your_key_here

# 至少配置一个新闻API
NEWSAPI_API_KEY=your_key_here
# 或
CURRENTS_API_KEY=your_key_here

# 天气API
OPENWEATHER_API_KEY=your_openweather_key_here

# 地理API
GEO_USER_AGENT=OpenClaw/1.0

# 医疗API
OPENFDA_API_KEY=your_openfda_key_here
USDA_API_KEY=your_usda_key_here

# 加密货币API
COINGECKO_API_KEY=your_coingecko_key_here

# API配置
API_CACHE_TTL=300
API_RATE_LIMIT_DELAY=1
API_TIMEOUT=30000
```

3. 重新启动OpenClaw使配置生效

## 使用

### 在OpenClaw对话中使用

#### 查询股票价格
```
用户: 查询苹果公司股票价格
OpenClaw: 调用 stock-price 工具
工具返回: {"success": true, "data": {"symbol": "AAPL", "price": 178.52, ...}}
OpenClaw: 苹果公司(AAPL)当前股价为 $178.52，上涨 1.33%
```

#### 获取股票历史数据
```
用户: 获取特斯拉最近30天的股价历史
OpenClaw: 调用 stock-history 工具
工具返回: {"success": true, "data": [...], "message": "获取到 TSLA 历史数据，共 30 条记录"}
```

#### 搜索新闻
```
用户: 搜索关于人工智能的最新新闻
OpenClaw: 调用 news-search 工具
工具返回: {"success": true, "data": [...], "message": "找到 15 篇关于 "人工智能" 的新闻"}
```

#### 获取头条新闻
```
用户: 显示最新的科技新闻头条
OpenClaw: 调用 news-headlines 工具
工具返回: {"success": true, "data": [...], "message": "获取到 technology 类别头条新闻 20 条"}
```

#### 搜索学术论文
```
用户: 查找关于深度学习的学术论文
OpenClaw: 调用 paper-search 工具
工具返回: {"success": true, "data": [...], "message": "找到 8 篇关于 "deep learning" 的学术论文"}
```

#### 查询天气
```
用户: 北京的天气怎么样？
OpenClaw: 调用 current-weather 工具
工具返回: {"success": true, "data": {"temperature": 25, "description": "晴", ...}}
OpenClaw: 北京当前天气：25°C，晴，湿度 65%
```

#### 地理编码
```
用户: 上海在哪里？
OpenClaw: 调用 geocode 工具
工具返回: {"success": true, "data": {"lat": 31.2304, "lon": 121.4737, ...}}
OpenClaw: 上海的坐标是：31.2304°N, 121.4737°E
```

#### 药物搜索
```
用户: 查找阿司匹林的信息
OpenClaw: 调用 drug-search 工具
工具返回: {"success": true, "data": [...], "message": "找到 5 个与 "aspirin" 相关的药物"}
```

#### 加密货币价格
```
用户: 比特币和以太坊的价格是多少？
OpenClaw: 调用 crypto-prices 工具
工具返回: {"success": true, "data": [...], "message": "获取到 2 个加密货币价格 (usd)"}
OpenClaw: 比特币: $45,000，以太坊: $3,000
```

## 工具列表

| 工具名 | 描述 | 参数 | 返回值 |
|--------|------|------|--------|
| `stock-price` | 获取股票实时价格 | `symbol` (股票代码) | `StockQuote` |
| `stock-history` | 获取股票历史数据 | `symbol`, `days` (默认30) | `HistoricalData[]` |
| `news-search` | 搜索新闻 | `query`, `days` (默认7), `maxResults` (默认20) | `NewsArticle[]` |
| `news-headlines` | 获取头条新闻 | `category` (默认technology) | `NewsArticle[]` |
| `paper-search` | 搜索学术论文 | `query`, `maxResults` (默认10) | `AcademicPaper[]` |
| `current-weather` | 获取当前天气 | `location`, `units` (默认metric) | `WeatherData` |
| `weather-forecast` | 获取天气预报 | `location`, `days` (默认3), `units` (默认metric) | `ForecastData` |
| `air-quality` | 获取空气质量指数 | `lat`, `lon` | `AirQualityData` |
| `geocode` | 地理编码 | `address` | `GeoResult` |
| `reverse-geocode` | 反向地理编码 | `lat`, `lon` | `AddressResult` |
| `nearby-places` | 搜索附近地点 | `lat`, `lon`, `query`, `radius` (默认1000) | `NearbyPlace[]` |
| `drug-search` | 搜索药物信息 | `query`, `limit` (默认10) | `DrugInfo[]` |
| `nutrition-info` | 获取营养信息 | `food`, `limit` (默认5) | `NutritionData[]` |
| `covid-stats` | 获取COVID-19统计 | `country` (可选) | `COVIDStats` |
| `crypto-prices` | 获取加密货币价格 | `ids[]`, `vsCurrency` (默认usd) | `CryptoPrice[]` |
| `crypto-details` | 获取加密货币详情 | `id` | `CryptoDetails` |
| `crypto-market` | 获取市场数据 | `vsCurrency` (默认usd), `limit` (默认100) | `MarketData[]` |
| `crypto-history` | 获取历史价格数据 | `id`, `vsCurrency` (默认usd), `days` (默认30) | `HistoricalPriceData` |
| `trending-cryptos` | 获取热门加密货币 | `vsCurrency` (默认usd) | `TrendingCrypto[]` |

## 数据类型

### StockQuote
```typescript
{
  symbol: string;        // 股票代码
  price: number;         // 当前价格
  change: number;        // 价格变化
  changePercent: number; // 变化百分比
  volume: number;        // 成交量
  timestamp: Date;       // 时间戳
}
```

### NewsArticle
```typescript
{
  title: string;         // 标题
  description: string;   // 描述
  content: string;       // 内容
  url: string;          // 原文链接
  source: string;       // 新闻来源
  author: string;       // 作者
  publishedAt: Date;    // 发布时间
  category?: string;    // 分类（可选）
}
```

### AcademicPaper
```typescript
{
  title: string;         // 论文标题
  abstract: string;      // 摘要
  authors: string[];     // 作者列表
  publishedDate: Date;   // 发布日期
  updatedDate: Date;     // 更新日期
  arxivId: string;       // arXiv ID
  pdfUrl: string;        // PDF链接
  categories: string[];  // 分类
  doi?: string;          // DOI（可选）
  journal?: string;      // 期刊（可选）
}
```

### WeatherData
```typescript
{
  location: string;      // 位置名称
  country: string;       // 国家代码
  temperature: number;   // 温度
  feels_like: number;    // 体感温度
  humidity: number;      // 湿度
  pressure: number;      // 气压
  wind_speed: number;    // 风速
  wind_direction: number;// 风向
  description: string;   // 天气描述
  icon: string;         // 天气图标代码
  visibility: number;   // 能见度
  cloudiness: number;   // 云量
  sunrise: string;      // 日出时间
  sunset: string;       // 日落时间
  timezone: number;     // 时区偏移
  timestamp: string;    // 数据时间戳
}
```

### GeoResult
```typescript
{
  lat: number;          // 纬度
  lon: number;          // 经度
  display_name: string; // 完整地址
  address: any;         // 地址组件
  type: string;         // 地点类型
  importance: number;   // 重要性评分
}
```

### DrugInfo
```typescript
{
  id: string;           // FDA ID
  openfda: any;         // FDA开放数据
  manufacturer_name: string; // 生产商
  product_type: string; // 产品类型
  generic_name: string[]; // 通用名
  brand_name: string[]; // 品牌名
  indication: string;   // 适应症
  dosage: string;       // 剂量信息
  warnings: string;     // 警告信息
  adverse_reactions: string; // 不良反应
}
```

### NutritionData
```typescript
{
  description: string;  // 食物描述
  fdc_id: number;      // USDA FDC ID
  brand: string;        // 品牌
  nutrients: {          // 营养成分
    name: string;       // 营养素名称
    value: number;      // 含量
    unit: string;       // 单位
  }[];
}
```

### CryptoPrice
```typescript
{
  id: string;          // 加密货币ID
  symbol: string;      // 符号
  current_price: number; // 当前价格
  market_cap: number;  // 市值
  price_change_24h: number; // 24小时价格变化
  price_change_percentage_24h: number; // 24小时变化百分比
}
```

## 开发

### 构建
```bash
cd skills/api-integration
npm install
npm run build
```

### 测试
```bash
# 确保已配置环境变量
node validate.js
```

### 开发模式
```bash
npm run dev
# 监听文件变化并自动编译
```

## 架构说明

### 统一API客户端 (UnifiedAPIClient)
- 处理所有HTTP请求
- 管理认证信息
- 实现缓存机制
- 处理速率限制
- 自动重试逻辑

### 适配器模式
每个领域都有独立的适配器：
- `FinanceAdapter`: 金融数据API
- `NewsAdapter`: 新闻聚合API
- `ResearchAdapter`: 科研数据API
- `WeatherAdapter`: 天气数据API
- `GeoAdapter`: 地理信息API
- `HealthAdapter`: 医疗健康API
- `CryptoAdapter`: 加密货币API

### 降级策略
- 主API失败时自动切换到备用API
- Alpha Vantage失败时使用Yahoo Finance
- NewsAPI失败时使用Currents

## 环境变量说明

| 变量名 | 描述 | 必需 | 默认值 |
|--------|------|------|--------|
| `ALPHA_VANTAGE_API_KEY` | Alpha Vantage API密钥 | 否 | - |
| `FINNHUB_API_KEY` | Finnhub API密钥 | 否 | - |
| `YAHOO_FINANCE_ENABLED` | 启用Yahoo Finance | 是 | true |
| `NEWSAPI_API_KEY` | NewsAPI密钥 | 否 | - |
| `CURRENTS_API_KEY` | Currents API密钥 | 否 | - |
| `ARXIV_ENABLED` | 启用arXiv | 是 | true |
| `PUBMED_ENABLED` | 启用PubMed | 是 | true |
| `OPENWEATHER_API_KEY` | OpenWeatherMap API密钥 | 否 | - |
| `GEO_USER_AGENT` | OpenStreetMap User-Agent | 是 | OpenClaw/1.0 |
| `GOOGLE_MAPS_API_KEY` | Google Maps API密钥 | 否 | - |
| `OPENFDA_API_KEY` | OpenFDA API密钥 | 否 | - |
| `USDA_API_KEY` | USDA API密钥 | 否 | - |
| `COINGECKO_API_KEY` | CoinGecko API密钥 | 否 | - |
| `API_CACHE_TTL` | 缓存时间（秒） | 否 | 300 |
| `API_RATE_LIMIT_DELAY` | 请求延迟（秒） | 否 | 1 |
| `API_TIMEOUT` | 请求超时（毫秒） | 否 | 30000 |

**注意**: 至少需要配置一个金融API和一个新闻API才能使用相应功能。

## 故障排除

### 常见问题

1. **API密钥未配置**
   ```
   错误: Alpha Vantage API密钥未配置
   解决: 在.env文件中设置ALPHA_VANTAGE_API_KEY
   ```

2. **速率限制**
   ```
   错误: 429 Too Many Requests
   解决: 等待一段时间后重试，或使用备用API
   ```

3. **缓存问题**
   ```
   现象: 数据不是最新的
   解决: 清除缓存或减少API_CACHE_TTL值
   ```

4. **网络错误**
   ```
   错误: Network Error
   解决: 检查网络连接，确认API服务可用性
   ```

### 调试模式

启用详细日志：
```bash
# 在OpenClaw中设置调试级别
export DEBUG=api-integration:*
```

## 性能优化

1. **缓存策略**: 合理设置`API_CACHE_TTL`平衡数据新鲜度和性能
2. **速率限制**: 根据API提供商的限制调整`API_RATE_LIMIT_DELAY`
3. **连接复用**: 客户端自动复用HTTP连接
4. **批量请求**: 支持批量数据获取，减少请求次数

## 安全考虑

1. **API密钥管理**: 使用环境变量，不要提交到版本控制
2. **密钥轮换**: 定期更新API密钥
3. **访问控制**: 限制API密钥的使用范围
4. **成本监控**: 监控API使用量，避免意外费用

## 扩展开发

### 添加新的API适配器

1. 在`src/adapters/`创建新的适配器文件
2. 实现对应的接口方法
3. 在主技能中注册适配器
4. 添加工具到`tools`对象
5. 更新文档和测试

## 许可证

MIT

## 贡献

欢迎提交Issue和Pull Request！

## 更新日志

### v1.0.0 (2025-02-16)
- 初始版本
- 支持金融数据API（Alpha Vantage, Yahoo Finance）
- 支持新闻API（NewsAPI, Currents）
- 支持科研数据API（arXiv, PubMed）
- 支持天气数据API（OpenWeatherMap）
- 支持地理信息API（OpenStreetMap）
- 支持医疗健康API（OpenFDA, USDA, COVID-19）
- 支持加密货币API（CoinGecko）
- 统一API客户端
- 自动重试和降级机制
- 智能缓存系统
- 完整的错误处理
- 17个专业工具
- 12个API提供商集成