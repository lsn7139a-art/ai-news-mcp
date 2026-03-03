const axios = require('axios');
const fs = require('fs');

async function scrapeWebsite() {
    const url = 'https://mcpservers.org/category/web-scraping';
    
    try {
        console.log('开始爬取网站:', url);
        
        // 发送HTTP请求获取网页内容
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 30000
        });
        
        console.log('成功获取网页内容，状态码:', response.status);
        console.log('响应内容长度:', response.data.length, '字符');
        
        const html = response.data;
        const scrapedData = {
            url: url,
            timestamp: new Date().toISOString(),
            title: '',
            description: '',
            content: {
                headings: [],
                links: [],
                text: '',
                tables: [],
                lists: []
            }
        };
        
        // 使用正则表达式提取标题
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
            scrapedData.title = titleMatch[1].trim();
        }
        
        // 提取meta描述
        const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
        if (descMatch) {
            scrapedData.description = descMatch[1].trim();
        }
        
        // 提取所有标题 (h1-h6)
        const headingRegex = /<h([1-6])[^>]*>([^<]+)<\/h[1-6]>/gi;
        let headingMatch;
        while ((headingMatch = headingRegex.exec(html)) !== null) {
            scrapedData.content.headings.push({
                level: parseInt(headingMatch[1]),
                text: headingMatch[2].replace(/<[^>]*>/g, '').trim()
            });
        }
        
        // 提取所有链接
        const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
        let linkMatch;
        while ((linkMatch = linkRegex.exec(html)) !== null) {
            const href = linkMatch[1];
            const text = linkMatch[2].replace(/<[^>]*>/g, '').trim();
            if (href && text) {
                scrapedData.content.links.push({
                    url: href.startsWith('http') ? href : new URL(href, url).href,
                    text: text
                });
            }
        }
        
        // 提取表格数据
        const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
        let tableMatch;
        while ((tableMatch = tableRegex.exec(html)) !== null) {
            const tableHtml = tableMatch[1];
            const tableData = { rows: [] };
            
            // 提取表格行
            const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
            let rowMatch;
            while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
                const rowHtml = rowMatch[1];
                const cells = [];
                
                // 提取单元格
                const cellRegex = /<t[dh][^>]*>([^<]*)<\/t[dh]>/gi;
                let cellMatch;
                while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
                    cells.push(cellMatch[1].trim());
                }
                
                if (cells.length > 0) {
                    tableData.rows.push(cells);
                }
            }
            
            if (tableData.rows.length > 0) {
                scrapedData.content.tables.push(tableData);
            }
        }
        
        // 提取列表数据
        const listRegex = /<[uo]l[^>]*>([\s\S]*?)<\/[uo]l>/gi;
        let listMatch;
        while ((listMatch = listRegex.exec(html)) !== null) {
            const listHtml = listMatch[1];
            const listData = { items: [] };
            
            // 提取列表项
            const itemRegex = /<li[^>]*>([^<]*)<\/li>/gi;
            let itemMatch;
            while ((itemMatch = itemRegex.exec(listHtml)) !== null) {
                const itemText = itemMatch[1].replace(/<[^>]*>/g, '').trim();
                if (itemText) {
                    listData.items.push(itemText);
                }
            }
            
            if (listData.items.length > 0) {
                scrapedData.content.lists.push(listData);
            }
        }
        
        // 提取纯文本内容（移除HTML标签）
        scrapedData.content.text = html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        
        // 保存结果到文件
        const fileName = `scraped-data-${Date.now()}.json`;
        fs.writeFileSync(fileName, JSON.stringify(scrapedData, null, 2), 'utf8');
        
        console.log('爬取完成！结果已保存到:', fileName);
        console.log('\n=== 爬取结果摘要 ===');
        console.log('网站标题:', scrapedData.title);
        console.log('描述:', scrapedData.description);
        console.log('提取的标题数量:', scrapedData.content.headings.length);
        console.log('提取的链接数量:', scrapedData.content.links.length);
        console.log('提取的表格数量:', scrapedData.content.tables.length);
        console.log('提取的列表数量:', scrapedData.content.lists.length);
        console.log('文本内容长度:', scrapedData.content.text.length, '字符');
        
        // 显示前几个标题
        if (scrapedData.content.headings.length > 0) {
            console.log('\n前5个标题:');
            scrapedData.content.headings.slice(0, 5).forEach(heading => {
                console.log(`${'#'.repeat(heading.level)} ${heading.text}`);
            });
        }
        
        // 显示前几个链接
        if (scrapedData.content.links.length > 0) {
            console.log('\n前5个链接:');
            scrapedData.content.links.slice(0, 5).forEach(link => {
                console.log(`- ${link.text} (${link.url})`);
            });
        }
        
        // 显示表格信息
        if (scrapedData.content.tables.length > 0) {
            console.log('\n表格数据:');
            scrapedData.content.tables.forEach((table, index) => {
                console.log(`表格 ${index + 1}: ${table.rows.length} 行`);
                if (table.rows.length > 0) {
                    console.log('  第一行:', table.rows[0].join(' | '));
                }
            });
        }
        
        // 显示列表信息
        if (scrapedData.content.lists.length > 0) {
            console.log('\n列表数据:');
            scrapedData.content.lists.forEach((list, index) => {
                console.log(`列表 ${index + 1}: ${list.items.length} 项`);
                console.log('  前3项:', list.items.slice(0, 3).join(', '));
            });
        }
        
        return scrapedData;
        
    } catch (error) {
        console.error('爬取过程中出现错误:', error.message);
        
        if (error.response) {
            console.error('HTTP状态码:', error.response.status);
            console.error('响应头:', error.response.headers);
        } else if (error.code === 'ECONNABORTED') {
            console.error('请求超时');
        } else {
            console.error('错误详情:', error);
        }
        
        throw error;
    }
}

// 运行爬虫
if (require.main === module) {
    scrapeWebsite()
        .then(data => {
            console.log('\n爬取任务完成！');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n爬取任务失败:', error.message);
            process.exit(1);
        });
}

module.exports = { scrapeWebsite };