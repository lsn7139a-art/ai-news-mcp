# BrightData MCP Server

A Model Context Protocol (MCP) server that provides BrightData proxy and web scraping capabilities for AI assistants.

## 功能特性

- 🔐 **代理请求**: 通过 BrightData 代理发起 HTTP 请求
- 🕷️ **网页抓取**: 使用 Puppeteer 通过代理抓取网页内容
- 🌍 **IP 轮换**: 利用 BrightData 的住宅和移动 IP 网络
- 📊 **内容提取**: 支持 CSS 选择器精确提取内容
- ⚙️ **配置灵活**: 支持多种代理设置和自定义选项

## 安装和配置

### 1. 安装依赖

```bash
cd brightdata-mcp
npm install
```

### 2. 配置 BrightData 凭据

编辑 `.env` 文件，填入您的 BrightData 账户信息：

```bash
# 复制示例配置文件
cp .env.example .env

# 编辑配置文件
nano .env
```

在 `.env` 文件中设置：

```env
# 必需：BrightData 账户凭据
BRIGHTDATA_USERNAME=your_brightdata_username
BRIGHTDATA_PASSWORD=your_brightdata_password

# 可选：代理服务器设置（默认值已提供）
BRIGHTDATA_HOST=brd.superproxy.io
BRIGHTDATA_PORT=22225

# 可选：区域和国家设置
BRIGHTDATA_ZONE=residential
BRIGHTDATA_COUNTRY=us
```

### 3. 获取 BrightData 凭据

1. 登录 [BrightData 控制台](https://dashboard.brightdata.com/)
2. 导航到 **Proxy & Scraping Infrastructure** > **Proxies**
3. 创建新的代理区域或使用现有区域
4. 复制用户名和密码（格式：`brd-customer-xxx-zone-xx` 和密码）

## 使用方法

### 启动 MCP 服务器

```bash
# 开发模式（带文件监视）
npm run dev

# 生产模式
npm start
```

### 与 Claude Desktop 配置

在 Claude Desktop 的配置文件中添加：

```json
{
  "mcpServers": {
    "brightdata-mcp": {
      "command": "node",
      "args": ["d:/AI/Claude code/brightdata-mcp/src/index.js"],
      "cwd": "d:/AI/Claude code/brightdata-mcp",
      "env": {
        "BRIGHTDATA_USERNAME": "your_username",
        "BRIGHTDATA_PASSWORD": "your_password"
      }
    }
  }
}
```

## 可用工具

### 1. `proxy_request`
通过 BrightData 代理发起 HTTP 请求。

**参数：**
- `url` (必需): 要请求的 URL
- `method` (可选): HTTP 方法 (GET, POST, PUT, DELETE)，默认 GET
- `headers` (可选): HTTP 头部对象
- `body` (可选): 请求体（用于 POST/PUT）

**示例：**
```json
{
  "url": "https://httpbin.org/ip",
  "method": "GET"
}
```

### 2. `scrape_webpage`
使用 BrightData 代理抓取网页内容。

**参数：**
- `url` (必需): 要抓取的 URL
- `selector` (可选): CSS 选择器，用于提取特定元素
- `wait_for` (可选): 等待的 CSS 选择器
- `timeout` (可选): 超时时间（毫秒），默认 30000

**示例：**
```json
{
  "url": "https://example.com",
  "selector": "main.content",
  "wait_for": ".loaded",
  "timeout": 60000
}
```

### 3. `get_proxy_info`
获取当前代理配置和状态。

**参数：** 无

## 使用示例

### 基本代理请求

```
使用 brightdata-mcp 发起代理请求到 https://httpbin.org/ip
```

### 网页抓取

```
使用 brightdata-mcp 抓取 https://news.ycombinator.com 的标题，使用选择器 .titleline
```

### 检查代理状态

```
使用 brightdata-mcp 获取代理配置信息
```

## 故障排除

### 常见问题

1. **认证失败**
   - 检查 `.env` 文件中的用户名和密码是否正确
   - 确保没有多余的空格或特殊字符

2. **连接超时**
   - 检查网络连接
   - 尝试增加 `timeout` 参数值
   - 确认 BrightData 账户有足够的余额

3. **Puppeteer 启动失败**
   - 确保 Node.js 版本 >= 16.0.0
   - 检查系统依赖是否完整安装

### 调试模式

设置环境变量启用调试：

```bash
LOG_LEVEL=debug npm run dev
```

### 测试代理连接

```bash
# 创建测试脚本
node -e "
import { testProxyConnection } from './src/brightdata.js';
testProxyConnection().then(console.log);
"
```

## 安全注意事项

- 🔒 不要将 `.env` 文件提交到版本控制
- 🛡️ 定期轮换 BrightData 凭据
- 📝 监控代理使用量避免超额费用
- 🚫 仅用于合法的数据抓取活动

## 代理类型

BrightData 支持多种代理类型：

- **住宅代理**: 真实住宅 IP，适合需要高匿名性的任务
- **数据中心代理**: 高速稳定，适合一般爬取任务
- **移动代理**: 移动设备 IP，适合移动端网站测试

## 高级配置

### 自定义用户代理

```env
USER_AGENT=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
```

### 区域设置

```env
BRIGHTDATA_ZONE=residential
BRIGHTDATA_COUNTRY=us,uk,de
```

## 许可证

MIT License

## 支持

- 📖 [BrightData 文档](https://brightdata.com/docs/)
- 🔧 [MCP 协议文档](https://modelcontextprotocol.io/)
- 🐛 问题反馈：请在 GitHub Issues 中报告

---

**注意**: 使用此服务器需要有效的 BrightData 账户。请确保遵守目标网站的服务条款和适用法律。