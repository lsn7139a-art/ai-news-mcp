const axios = require('axios');
const cheerio = require('cheerio');
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
        
        // 使用cheerio解析HTML
        const $ = cheerio.load(response.data);
        const scrapedData = {
            url: url,
            timestamp: new Date().toISOString(),
            title: $('title').text() || '',
            description: $('meta[name="description"]').attr('content') || '',
            content: {
                headings: [],
                links: [],
                text: ''
            }
        };
        
        // 提取标题
        $('h1, h2, h3, h4, h5, h6').each((i, elem) => {
            scrapedData.content.headings.push({
                level: parseInt(elem.name.substring(1)),
                text: $(elem).text().trim()
            });
        });
        
        // 提取链接
        $('a[href]').each((i, elem) => {
            const href = $(elem).attr('href');
            const text = $(elem).text().trim();
            if (href && text) {
                scrapedData.content.links.push({
                    url: href.startsWith('http') ? href : new URL(href, url).href,
                    text: text
                });
            }
        });
        
        // 提取主要内容文本
        scrapedData.content.text = $('body').text().replace(/\s+/g, ' ').trim();
        
        // 保存结果到文件
        const fileName = `scraped-data-${Date.now()}.json`;
        fs.writeFileSync(fileName, JSON.stringify(scrapedData, null, 2), 'utf8');
        
        console.log('爬取完成！结果已保存到:', fileName);
        console.log('\n=== 爬取结果摘要 ===');
        console.log('网站标题:', scrapedData.title);
        console.log('描述:', scrapedData.description);
        console.log('提取的标题数量:', scrapedData.content.headings.length);
        console.log('提取的链接数量:', scrapedData.content.links.length);
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