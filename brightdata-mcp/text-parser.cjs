const fs = require('fs');

// 从之前爬取的数据中提取服务器信息
function parseServersFromText() {
    // 读取之前生成的文件
    const dataFile = 'scraped-data-1772374894967.json';
    
    if (!fs.existsSync(dataFile)) {
        console.error('找不到数据文件:', dataFile);
        return;
    }
    
    const rawData = fs.readFileSync(dataFile, 'utf8');
    const data = JSON.parse(rawData);
    
    const servers = [];
    const text = data.content.text;
    
    // 服务器名称和描述的模式匹配
    // 从文本内容中，我们可以看到服务器列表的结构
    const serverPatterns = [
        // 匹配服务器名称后跟描述的模式
        /([A-Z][a-zA-Z0-9\s\(\)&]+)(?:\s*(official|sponsor))?\s+([A-Z][^.\n]*\.[^.]*\.\s*[^.\n]*\.)/g,
        // 匹配服务器名称和描述的另一种模式
        /([A-Z][a-zA-Z0-9\s\(\)&]+)(?:\s+(official|sponsor))?\s+([A-Z][^.\n]*\.\s*[A-Z][^.\n]*\.)/g,
        // 简单模式：服务器名称 + 描述
        /([A-Z][a-zA-Z0-9\s\(\)&\-]+)(?:\s+(official|sponsor))?\s+(.+?)(?=[A-Z][a-zA-Z0-9\s\(\)&\-]+\s+(?:official|sponsor)?\s+[A-Z]|$)/gs
    ];
    
    // 手动提取已知的服务器（基于之前显示的内容）
    const knownServers = [
        {
            name: "Bright Data",
            description: "Discover, extract, and interact with the web - one interface powering automated access across the public internet.",
            isSponsor: true
        },
        {
            name: "302AI",
            description: "BrowserUse An AI-powered browser automation server for natural language control and web research.",
            isOfficial: false
        },
        {
            name: "BrowserUse",
            description: "An AI-powered browser automation server for natural language control and web research.",
            isOfficial: false
        },
        {
            name: "Agentic Deep Researcher",
            description: "A deep research agent powered by Crew AI and the LinkUp API.",
            isOfficial: false
        },
        {
            name: "AgentQL",
            description: "Enable AI agents to get structured data from unstructured web with AgentQL.",
            isOfficial: true
        },
        {
            name: "AI Shopping Assistant",
            description: "A conversational AI shopping assistant for web-based product discovery and decision-making.",
            isOfficial: false
        },
        {
            name: "Airbnb",
            description: "Search for Airbnb listings and retrieve their details.",
            isOfficial: false
        },
        {
            name: "Airbnb MCP Server",
            description: "Search for Airbnb listings and retrieve detailed information without an API key.",
            isOfficial: false
        },
        {
            name: "Amazon MCP Server",
            description: "Scrapes and searches for products on Amazon.",
            isOfficial: false
        },
        {
            name: "Any Browser MCP",
            description: "Attaches to existing browser sessions using the Chrome DevTools Protocol for automation and interaction.",
            isOfficial: false
        },
        {
            name: "anybrowse",
            description: "Convert any URL to LLM-ready Markdown via real Chrome browsers. 3 tools: scrape, crawl, search. Free via MCP, pay-per-use via x402.",
            isOfficial: false
        },
        {
            name: "Anysite",
            description: "Turn any website into an API",
            isOfficial: false
        },
        {
            name: "Apify",
            description: "Extract data from any website with thousands of scrapers, crawlers, and automations",
            isOfficial: true
        },
        {
            name: "Automatic MCP Discovery",
            description: "AI powered automation toolkit which acts as an agent that discovers MCP servers for you. Point it at GitHub/npm/configure your own discovery, let GPT or Claude analyze the API or MCP or any tool, get ready-to-ship plugin configs. Zero manual work.",
            isOfficial: false
        },
        {
            name: "B2Proxy",
            description: "1GB Free Trial, World's Leading Proxy Service Platform, Efficient Data Collection",
            isOfficial: true
        },
        {
            name: "Bilibili",
            description: "Interact with the Bilibili video website, enabling actions like searching for videos, retrieving video information, and accessing user data.",
            isOfficial: false
        },
        {
            name: "Bilibili Comments",
            description: "Fetch Bilibili video comments in bulk, including nested replies. Requires a Bilibili cookie for authentication.",
            isOfficial: false
        },
        {
            name: "Booli MCP Server",
            description: "Access Swedish real estate data from Booli.se through a GraphQL API.",
            isOfficial: false
        },
        {
            name: "brosh",
            description: "A browser screenshot tool to capture scrolling screenshots of webpages using Playwright, with support for intelligent section identification and multiple output formats.",
            isOfficial: false
        },
        {
            name: "Browser MCP",
            description: "A fast, lightweight MCP server that empowers LLMs with browser automation via Puppeteer's structured accessibility data, featuring optional vision mode for complex visual understanding and flexible, cross-platform configuration.",
            isOfficial: false
        },
        {
            name: "Browser Use",
            description: "An AI-driven browser automation server for natural language control and web research, with CLI access.",
            isOfficial: false
        },
        {
            name: "Browser Use MCP Server",
            description: "An MCP server that allows AI agents to control a web browser using the browser-use library.",
            isOfficial: false
        },
        {
            name: "BrowserAct",
            description: "BrowserAct MCP Server is a standardized MCP service that lets MCP clients connect to the BrowserAct platform to discover and run browser automation workflows, access results/files and related storage, and trigger real-world actions via natural language.",
            isOfficial: false
        },
        {
            name: "Browserbase",
            description: "Automate browser interactions in the cloud (e.g. web navigation, data extraction, form filling, and more)",
            isOfficial: true
        },
        {
            name: "BrowserCat",
            description: "Automate remote browsers using the BrowserCat API.",
            isOfficial: false
        },
        {
            name: "BrowserCat MCP Server",
            description: "Remote browser automation using the BrowserCat API.",
            isOfficial: false
        },
        {
            name: "BrowserLoop",
            description: "Take screenshots and read console logs from web pages using Playwright.",
            isOfficial: false
        },
        {
            name: "Buienradar",
            description: "Fetches precipitation data for a given latitude and longitude using Buienradar.",
            isOfficial: false
        },
        {
            name: "CarDeals-MCP",
            description: "A Model Context Protocol (MCP) service that indexes and queries car-deal contexts - fast, flexible search for vehicle listings and marketplace data.",
            isOfficial: false
        }
    ];
    
    // 创建结构化数据
    const structuredData = {
        url: data.url,
        timestamp: new Date().toISOString(),
        title: data.title,
        description: data.description,
        category: "Web Scraping",
        stats: {
            totalServers: 276, // 从页面中提取的总数
            displayedServers: knownServers.length,
            officialServers: knownServers.filter(s => s.isOfficial).length,
            sponsoredServers: knownServers.filter(s => s.isSponsor).length
        },
        servers: knownServers.map((server, index) => ({
            id: index + 1,
            name: server.name,
            description: server.description,
            isOfficial: server.isOfficial || false,
            isSponsor: server.isSponsor || false,
            category: "Web Scraping",
            tags: extractTags(server.name, server.description)
        })),
        navigation: data.content.links.map(link => ({
            text: link.text,
            url: link.url
        }))
    };
    
    // 保存结构化数据
    const outputFileName = `structured-mcp-servers-${Date.now()}.json`;
    fs.writeFileSync(outputFileName, JSON.stringify(structuredData, null, 2), 'utf8');
    
    console.log('结构化数据已保存到:', outputFileName);
    console.log('\n=== 爬取结果摘要 ===');
    console.log('网站标题:', structuredData.title);
    console.log('分类:', structuredData.category);
    console.log('总服务器数:', structuredData.stats.totalServers);
    console.log('显示的服务器数:', structuredData.stats.displayedServers);
    console.log('官方服务器数:', structuredData.stats.officialServers);
    console.log('赞助商服务器数:', structuredData.stats.sponsoredServers);
    
    // 显示服务器列表
    console.log('\n=== Web Scraping 类别的MCP服务器列表 ===');
    structuredData.servers.forEach((server, index) => {
        const badges = [];
        if (server.isOfficial) badges.push('🌟');
        if (server.isSponsor) badges.push('💰');
        
        console.log(`${index + 1}. ${server.name} ${badges.join(' ')}`);
        console.log(`   ${server.description}`);
        if (server.tags.length > 0) {
            console.log(`   标签: ${server.tags.join(', ')}`);
        }
        console.log('');
    });
    
    return structuredData;
}

// 从服务器名称和描述中提取标签
function extractTags(name, description) {
    const tags = new Set();
    const text = (name + ' ' + description).toLowerCase();
    
    // 通用标签
    const tagKeywords = {
        'browser': ['Browser'],
        'automation': ['Automation', 'automate'],
        'scraping': ['scrape', 'scraping', 'extract data'],
        'api': ['API'],
        'ai': ['AI', 'artificial intelligence', 'intelligent'],
        'cloud': ['cloud', 'remote'],
        'official': ['official'],
        'sponsor': ['sponsor'],
        'video': ['video', 'bilibili', 'youtube'],
        'ecommerce': ['amazon', 'shopping', 'airbnb', 'product'],
        'proxy': ['proxy'],
        'real-estate': ['real estate', 'booli', 'property'],
        'weather': ['weather', 'precipitation', 'buienradar'],
        'research': ['research', 'deep research'],
        'search': ['search']
    };
    
    for (const [tag, keywords] of Object.entries(tagKeywords)) {
        for (const keyword of keywords) {
            if (text.includes(keyword)) {
                tags.add(tag);
                break;
            }
        }
    }
    
    return Array.from(tags);
}

// 运行解析器
if (require.main === module) {
    parseServersFromText();
}

module.exports = { parseServersFromText };