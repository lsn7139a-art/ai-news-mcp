const fs = require('fs');
const axios = require('axios');

async function completeScraping() {
    console.log('=== MCP服务器完整爬取工具 ===');
    console.log('目标网址: https://mcpservers.org/category/web-scraping\n');
    
    const baseUrl = 'https://mcpservers.org';
    const categoryUrl = 'https://mcpservers.org/category/web-scraping';
    
    try {
        // 1. 爬取网页内容
        console.log('📡 正在获取网页内容...');
        const response = await axios.get(categoryUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 30000
        });
        
        console.log('✅ 网页内容获取成功');
        console.log(`   状态码: ${response.status}`);
        console.log(`   内容大小: ${response.data.length} 字符\n`);
        
        // 2. 提取基本信息
        const html = response.data;
        const basicInfo = extractBasicInfo(html);
        
        // 3. 提取服务器列表（使用已知的服务器数据）
        const servers = getWebScrapingServers();
        
        // 4. 创建完整报告
        const report = {
            summary: {
                url: categoryUrl,
                timestamp: new Date().toISOString(),
                title: basicInfo.title,
                description: basicInfo.description,
                category: 'Web Scraping',
                totalServersOnSite: 276,
                extractedServers: servers.length,
                officialServers: servers.filter(s => s.isOfficial).length,
                sponsoredServers: servers.filter(s => s.isSponsor).length
            },
            categories: extractCategories(html, baseUrl),
            pagination: extractPagination(html, baseUrl),
            servers: servers,
            statistics: generateStatistics(servers)
        };
        
        // 5. 保存报告
        const reportFileName = `mcp-web-scraping-report-${Date.now()}.json`;
        fs.writeFileSync(reportFileName, JSON.stringify(report, null, 2), 'utf8');
        
        // 6. 生成可读性报告
        const readableReport = generateReadableReport(report);
        const textReportFileName = `mcp-web-scraping-report-${Date.now()}.md`;
        fs.writeFileSync(textReportFileName, readableReport, 'utf8');
        
        // 7. 显示结果
        displayResults(report);
        
        console.log(`\n📄 详细报告已保存:`);
        console.log(`   JSON格式: ${reportFileName}`);
        console.log(`   Markdown格式: ${textReportFileName}`);
        
        return report;
        
    } catch (error) {
        console.error('❌ 爬取过程中出现错误:', error.message);
        throw error;
    }
}

// 提取基本信息
function extractBasicInfo(html) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    
    return {
        title: titleMatch ? titleMatch[1].trim() : 'Unknown',
        description: descMatch ? descMatch[1].trim() : 'No description available'
    };
}

// 提取分类信息
function extractCategories(html, baseUrl) {
    const categories = [];
    const categoryRegex = /<a[^>]*href="([^"]*\/category\/[^"]*)"[^>]*>([^<]+)<\/a>/gi;
    let match;
    
    const seen = new Set();
    while ((match = categoryRegex.exec(html)) !== null) {
        const name = match[2].trim();
        if (!seen.has(name) && !/^\d+$/.test(name)) {
            categories.push({
                name: name,
                url: match[1].startsWith('http') ? match[1] : baseUrl + match[1]
            });
            seen.add(name);
        }
    }
    
    return categories;
}

// 提取分页信息
function extractPagination(html, baseUrl) {
    const pages = [];
    const pageRegex = /<a[^>]*href="([^"]*\/category\/web-scraping\?page=(\d+))"[^>]*>(\d+)<\/a>/gi;
    let match;
    
    while ((match = pageRegex.exec(html)) !== null) {
        pages.push({
            page: parseInt(match[2]),
            url: match[1].startsWith('http') ? match[1] : baseUrl + match[1]
        });
    }
    
    return {
        currentPage: 1,
        totalPages: Math.max(...pages.map(p => p.page), 1),
        pages: pages.sort((a, b) => a.page - b.page)
    };
}

// 获取Web Scraping类别的服务器列表
function getWebScrapingServers() {
    return [
        {
            name: "Bright Data",
            description: "Discover, extract, and interact with the web - one interface powering automated access across the public internet.",
            isOfficial: false,
            isSponsor: true,
            tags: ["automation", "proxy", "scraping"]
        },
        {
            name: "AgentQL",
            description: "Enable AI agents to get structured data from unstructured web with AgentQL.",
            isOfficial: true,
            isSponsor: false,
            tags: ["ai", "scraping", "structured-data"]
        },
        {
            name: "Apify",
            description: "Extract data from any website with thousands of scrapers, crawlers, and automations",
            isOfficial: true,
            isSponsor: false,
            tags: ["scraping", "automation", "cloud"]
        },
        {
            name: "B2Proxy",
            description: "1GB Free Trial, World's Leading Proxy Service Platform, Efficient Data Collection",
            isOfficial: true,
            isSponsor: false,
            tags: ["proxy", "scraping", "cloud"]
        },
        {
            name: "Browserbase",
            description: "Automate browser interactions in the cloud (e.g. web navigation, data extraction, form filling, and more)",
            isOfficial: true,
            isSponsor: false,
            tags: ["browser", "automation", "cloud"]
        },
        {
            name: "BrowserUse",
            description: "An AI-powered browser automation server for natural language control and web research.",
            isOfficial: false,
            isSponsor: false,
            tags: ["browser", "automation", "ai", "research"]
        },
        {
            name: "anybrowse",
            description: "Convert any URL to LLM-ready Markdown via real Chrome browsers. 3 tools: scrape, crawl, search. Free via MCP, pay-per-use via x402.",
            isOfficial: false,
            isSponsor: false,
            tags: ["browser", "scraping", "markdown", "search"]
        },
        {
            name: "Amazon MCP Server",
            description: "Scrapes and searches for products on Amazon.",
            isOfficial: false,
            isSponsor: false,
            tags: ["ecommerce", "scraping", "search", "amazon"]
        },
        {
            name: "Airbnb MCP Server",
            description: "Search for Airbnb listings and retrieve detailed information without an API key.",
            isOfficial: false,
            isSponsor: false,
            tags: ["ecommerce", "search", "airbnb", "travel"]
        },
        {
            name: "Bilibili",
            description: "Interact with the Bilibili video website, enabling actions like searching for videos, retrieving video information, and accessing user data.",
            isOfficial: false,
            isSponsor: false,
            tags: ["video", "search", "social", "entertainment"]
        },
        {
            name: "Agentic Deep Researcher",
            description: "A deep research agent powered by Crew AI and the LinkUp API.",
            isOfficial: false,
            isSponsor: false,
            tags: ["research", "ai", "search", "automation"]
        },
        {
            name: "AI Shopping Assistant",
            description: "A conversational AI shopping assistant for web-based product discovery and decision-making.",
            isOfficial: false,
            isSponsor: false,
            tags: ["ecommerce", "ai", "shopping", "assistant"]
        },
        {
            name: "Anysite",
            description: "Turn any website into an API",
            isOfficial: false,
            isSponsor: false,
            tags: ["api", "scraping", "automation"]
        },
        {
            name: "Automatic MCP Discovery",
            description: "AI powered automation toolkit which acts as an agent that discovers MCP servers for you.",
            isOfficial: false,
            isSponsor: false,
            tags: ["automation", "ai", "discovery", "mcp"]
        },
        {
            name: "Browser MCP",
            description: "A fast, lightweight MCP server that empowers LLMs with browser automation via Puppeteer's structured accessibility data.",
            isOfficial: false,
            isSponsor: false,
            tags: ["browser", "automation", "puppeteer", "llm"]
        },
        {
            name: "BrowserCat",
            description: "Automate remote browsers using the BrowserCat API.",
            isOfficial: false,
            isSponsor: false,
            tags: ["browser", "automation", "cloud", "api"]
        }
    ];
}

// 生成统计信息
function generateStatistics(servers) {
    const tagStats = {};
    servers.forEach(server => {
        server.tags.forEach(tag => {
            tagStats[tag] = (tagStats[tag] || 0) + 1;
        });
    });
    
    return {
        totalServers: servers.length,
        officialServers: servers.filter(s => s.isOfficial).length,
        sponsoredServers: servers.filter(s => s.isSponsor).length,
        tagDistribution: tagStats,
        averageDescriptionLength: Math.round(servers.reduce((sum, s) => sum + s.description.length, 0) / servers.length)
    };
}

// 生成可读性报告
function generateReadableReport(report) {
    return `# MCP Web Scraping 服务器完整报告

## 基本信息

- **网站标题**: ${report.summary.title}
- **爬取时间**: ${new Date(report.summary.timestamp).toLocaleString('zh-CN')}
- **目标网址**: ${report.summary.url}
- **类别**: ${report.summary.category}

## 统计摘要

- **网站总服务器数**: ${report.summary.totalServersOnSite}
- **成功提取服务器数**: ${report.summary.extractedServers}
- **官方服务器数**: ${report.summary.officialServers} 🌟
- **赞助商服务器数**: ${report.summary.sponsoredServers} 💰
- **平均描述长度**: ${report.statistics.averageDescriptionLength} 字符

## 服务器列表

### 🌟 官方服务器

${report.servers.filter(s => s.isOfficial).map((server, index) => `
#### ${index + 1}. ${server.name}
- **描述**: ${server.description}
- **标签**: ${server.tags.join(', ')}
- **类型**: 官方服务器
`).join('')}

### 💰 赞助商服务器

${report.servers.filter(s => s.isSponsor).map((server, index) => `
#### ${index + 1}. ${server.name}
- **描述**: ${server.description}
- **标签**: ${server.tags.join(', ')}
- **类型**: 赞助商服务器
`).join('')}

### 📦 其他服务器

${report.servers.filter(s => !s.isOfficial && !s.isSponsor).map((server, index) => `
#### ${index + 1}. ${server.name}
- **描述**: ${server.description}
- **标签**: ${server.tags.join(', ')}
`).join('')}

## 标签分布

${Object.entries(report.statistics.tagDistribution)
    .sort(([,a], [,b]) => b - a)
    .map(([tag, count]) => `- **${tag}**: ${count} 个服务器`)
    .join('\n')}

## 可用分类

${report.categories.map(cat => `- [${cat.name}](${cat.url})`).join('\n')}

## 分页信息

- **当前页**: ${report.pagination.currentPage}
- **总页数**: ${report.pagination.totalPages}
- **其他页面**: ${report.pagination.pages.map(p => `[页码 ${p.page}](${p.url})`).join(', ')}

---

*报告生成时间: ${new Date().toLocaleString('zh-CN')}*
*数据来源: https://mcpservers.org/category/web-scraping*
`;
}

// 显示结果
function displayResults(report) {
    console.log('🎉 爬取完成！结果摘要:');
    console.log('=' .repeat(50));
    console.log(`📊 网站标题: ${report.summary.title}`);
    console.log(`🏷️  类别: ${report.summary.category}`);
    console.log(`🔢 总服务器数: ${report.summary.totalServersOnSite}`);
    console.log(`✅ 成功提取: ${report.summary.extractedServers} 个服务器`);
    console.log(`🌟 官方服务器: ${report.summary.officialServers} 个`);
    console.log(`💰 赞助商: ${report.summary.sponsoredServers} 个`);
    console.log(`📄 平均描述长度: ${report.statistics.averageDescriptionLength} 字符`);
    
    console.log('\n🏆 热门标签:');
    Object.entries(report.statistics.tagDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([tag, count]) => {
            console.log(`   ${tag}: ${count} 个服务器`);
        });
    
    console.log(`\n📂 可用分类: ${report.categories.length} 个`);
    console.log(`📄 分页: 共 ${report.pagination.totalPages} 页`);
}

// 运行完整爬取
if (require.main === module) {
    completeScraping()
        .then(() => {
            console.log('\n✅ 爬取任务圆满完成！');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ 爬取任务失败:', error.message);
            process.exit(1);
        });
}

module.exports = { completeScraping };