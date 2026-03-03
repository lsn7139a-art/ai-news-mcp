const axios = require('axios');
const fs = require('fs');

async function scrapeMcpServers() {
    const baseUrl = 'https://mcpservers.org';
    const categoryUrl = 'https://mcpservers.org/category/web-scraping';
    
    try {
        console.log('开始爬取MCP服务器页面:', categoryUrl);
        
        // 发送HTTP请求获取网页内容
        const response = await axios.get(categoryUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 30000
        });
        
        console.log('成功获取网页内容，状态码:', response.status);
        console.log('响应内容长度:', response.data.length, '字符');
        
        const html = response.data;
        const scrapedData = {
            url: categoryUrl,
            timestamp: new Date().toISOString(),
            title: '',
            description: '',
            category: 'Web Scraping',
            servers: [],
            navigation: {
                categories: [],
                pagination: {
                    current: 1,
                    totalPages: 0,
                    pages: []
                }
            },
            stats: {
                totalServers: 0,
                displayedServers: 0
            }
        };
        
        // 提取网站标题
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
            scrapedData.title = titleMatch[1].trim();
        }
        
        // 提取meta描述
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
        if (descMatch) {
            scrapedData.description = descMatch[1].trim();
        }
        
        // 提取服务器统计信息
        const statsMatch = html.match(/Showing\s+(\d+)\s*-\s*(\d+)\s+of\s+(\d+)\s+servers/i);
        if (statsMatch) {
            scrapedData.stats.displayedServers = parseInt(statsMatch[2]);
            scrapedData.stats.totalServers = parseInt(statsMatch[3]);
        }
        
        // 提取服务器列表 - 改进的解析逻辑
        const serverRegex = /<div[^>]*class="[^"]*server[^"]*"[^>]*>([\s\S]*?)<\/div>(?=<div[^>]*class="[^"]*server[^"]*"|$)/gi;
        let serverMatch;
        while ((serverMatch = serverRegex.exec(html)) !== null) {
            const serverHtml = serverMatch[1];
            const server = extractServerInfo(serverHtml, baseUrl);
            if (server.name) {
                scrapedData.servers.push(server);
            }
        }
        
        // 如果上面的方法没找到服务器，尝试其他可能的HTML结构
        if (scrapedData.servers.length === 0) {
            console.log('尝试备用解析方法...');
            extractServersFromText(html, scrapedData.servers);
        }
        
        // 提取分类导航
        const categoryRegex = /<a[^>]*href="([^"]*\/category\/[^"]*)"[^>]*>([^<]+)<\/a>/gi;
        let catMatch;
        while ((catMatch = categoryRegex.exec(html)) !== null) {
            scrapedData.navigation.categories.push({
                url: catMatch[1].startsWith('http') ? catMatch[1] : baseUrl + catMatch[1],
                name: catMatch[2].trim()
            });
        }
        
        // 提取分页信息
        const paginationRegex = /<a[^>]*href="([^"]*\/category\/web-scraping\?page=(\d+))"[^>]*>(\d+)<\/a>/gi;
        let pageMatch;
        while ((pageMatch = paginationRegex.exec(html)) !== null) {
            const pageNum = parseInt(pageMatch[2]);
            scrapedData.navigation.pagination.pages.push({
                url: pageMatch[1].startsWith('http') ? pageMatch[1] : baseUrl + pageMatch[1],
                page: pageNum
            });
            scrapedData.navigation.pagination.totalPages = Math.max(scrapedData.pagination?.totalPages || 0, pageNum);
        }
        
        // 保存结果到文件
        const fileName = `mcp-servers-${Date.now()}.json`;
        fs.writeFileSync(fileName, JSON.stringify(scrapedData, null, 2), 'utf8');
        
        console.log('爬取完成！结果已保存到:', fileName);
        console.log('\n=== 爬取结果摘要 ===');
        console.log('网站标题:', scrapedData.title);
        console.log('分类:', scrapedData.category);
        console.log('总服务器数:', scrapedData.stats.totalServers);
        console.log('显示的服务器数:', scrapedData.servers.length);
        console.log('分类数量:', scrapedData.navigation.categories.length);
        console.log('分页总数:', scrapedData.navigation.pagination.totalPages);
        
        // 显示前10个服务器
        if (scrapedData.servers.length > 0) {
            console.log('\n前10个服务器:');
            scrapedData.servers.slice(0, 10).forEach((server, index) => {
                console.log(`${index + 1}. ${server.name}`);
                if (server.description) {
                    console.log(`   描述: ${server.description.substring(0, 100)}...`);
                }
                if (server.isOfficial) {
                    console.log(`   🌟 官方服务器`);
                }
            });
        }
        
        return scrapedData;
        
    } catch (error) {
        console.error('爬取过程中出现错误:', error.message);
        throw error;
    }
}

// 从服务器HTML块中提取详细信息
function extractServerInfo(serverHtml, baseUrl) {
    const server = {
        name: '',
        description: '',
        url: '',
        isOfficial: false,
        isSponsor: false,
        tags: []
    };
    
    // 提取服务器名称
    const nameMatch = serverHtml.match(/<h[^>]*>([^<]+)<\/h>/i) || 
                     serverHtml.match(/<div[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<\/div>/i);
    if (nameMatch) {
        server.name = nameMatch[1].replace(/🌟|sponsor/gi, '').trim();
    }
    
    // 检查是否为官方服务器
    if (serverHtml.includes('official') || serverHtml.includes('🌟')) {
        server.isOfficial = true;
    }
    
    // 检查是否为赞助商
    if (serverHtml.includes('sponsor')) {
        server.isSponsor = true;
    }
    
    // 提取描述
    const descMatch = serverHtml.match(/<p[^>]*class="[^"]*description[^"]*"[^>]*>([^<]+)<\/p>/i) ||
                     serverHtml.match(/<div[^>]*class="[^"]*desc[^"]*"[^>]*>([^<]+)<\/div>/i);
    if (descMatch) {
        server.description = descMatch[1].trim();
    }
    
    // 提取链接
    const linkMatch = serverHtml.match(/<a[^>]*href="([^"]*)"[^>]*>/i);
    if (linkMatch) {
        server.url = linkMatch[1].startsWith('http') ? linkMatch[1] : baseUrl + linkMatch[1];
    }
    
    return server;
}

// 从文本内容中提取服务器信息（备用方法）
function extractServersFromText(html, servers) {
    // 从文本中识别服务器名称和描述的模式
    const lines = html.split('\n');
    let currentServer = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 跳过空行和明显不是服务器名称的行
        if (!line || line.length < 3 || line.includes('Showing') || line.includes('servers') || 
            line.includes('Sort by') || line.includes('Previous') || line.includes('Next')) {
            continue;
        }
        
        // 查找可能的服务器名称（通常以大写字母开头，不包含HTML标签）
        const possibleName = line.replace(/<[^>]*>/g, '').trim();
        
        // 简单启发式：如果这行看起来像服务器名称，下一行可能是描述
        if (possibleName && possibleName.length < 50 && 
            /^[A-Z][a-zA-Z0-9\s]+$/.test(possibleName) && 
            !possibleName.includes('MCP') && !possibleName.includes('Servers')) {
            
            currentServer = {
                name: possibleName,
                description: '',
                url: '',
                isOfficial: false,
                isSponsor: false,
                tags: []
            };
            
            // 查找下一行作为描述
            if (i + 1 < lines.length) {
                const nextLine = lines[i + 1].replace(/<[^>]*>/g, '').trim();
                if (nextLine && nextLine.length > 20 && nextLine.length < 200) {
                    currentServer.description = nextLine;
                }
            }
            
            servers.push(currentServer);
        }
    }
}

// 运行爬虫
if (require.main === module) {
    scrapeMcpServers()
        .then(data => {
            console.log('\n爬取任务完成！');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n爬取任务失败:', error.message);
            process.exit(1);
        });
}

module.exports = { scrapeMcpServers };