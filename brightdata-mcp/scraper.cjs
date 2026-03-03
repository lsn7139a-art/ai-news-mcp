const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * 爬取 mcpservers.org 网站内容
 */
async function scrapeMcpServers() {
    const targetUrl = 'https://mcpservers.org/category/web-scraping';
    let browser;
    
    console.log(`🚀 开始爬取网站: ${targetUrl}`);
    
    try {
        // 启动浏览器
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu',
                '--window-size=1920,1080'
            ]
        });
        
        const page = await browser.newPage();
        
        // 设置用户代理
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        // 设置视口
        await page.setViewport({ width: 1920, height: 1080 });
        
        console.log('📄 正在加载页面...');
        
        // 导航到目标页面
        await page.goto(targetUrl, { 
            waitUntil: 'networkidle2', 
            timeout: 60000 
        });
        
        console.log('⏳ 等待页面内容加载...');
        
        // 等待一些关键元素加载
        try {
            await page.waitForSelector('body', { timeout: 10000 });
        } catch (error) {
            console.log('⚠️ 页面可能仍在加载中，继续提取内容...');
        }
        
        // 提取页面内容
        console.log('📊 正在提取页面内容...');
        
        const pageData = await page.evaluate(() => {
            // 提取基本信息
            const title = document.title || '';
            const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
            
            // 提取主要文章内容
            const articles = [];
            const articleElements = document.querySelectorAll('article, .post, .entry, .item');
            
            articleElements.forEach((article, index) => {
                const articleData = {
                    index: index + 1,
                    title: article.querySelector('h1, h2, h3, h4, .title, .entry-title')?.textContent?.trim() || '',
                    link: article.querySelector('a')?.href || '',
                    excerpt: article.querySelector('.excerpt, .summary, .entry-content, .content')?.textContent?.trim() || '',
                    date: article.querySelector('.date, .published, .time, .timestamp')?.textContent?.trim() || '',
                    author: article.querySelector('.author, .by-author')?.textContent?.trim() || '',
                    category: article.querySelector('.category, .tag, .label')?.textContent?.trim() || ''
                };
                
                if (articleData.title || articleData.excerpt) {
                    articles.push(articleData);
                }
            });
            
            // 提取导航链接
            const navLinks = [];
            const navElements = document.querySelectorAll('nav a, .menu a, .navigation a');
            
            navElements.forEach(link => {
                const href = link.getAttribute('href');
                const text = link.textContent?.trim();
                if (href && text && href !== '#') {
                    navLinks.push({
                        text: text,
                        href: href
                    });
                }
            });
            
            // 提取页面结构信息
            const structure = {
                headings: [],
                images: [],
                links: []
            };
            
            // 提取标题
            document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
                structure.headings.push({
                    tag: heading.tagName,
                    text: heading.textContent?.trim() || '',
                    id: heading.id || ''
                });
            });
            
            // 提取图片
            document.querySelectorAll('img').forEach(img => {
                structure.images.push({
                    src: img.src || '',
                    alt: img.alt || '',
                    title: img.title || ''
                });
            });
            
            // 提取链接
            document.querySelectorAll('a[href]').forEach(link => {
                const href = link.getAttribute('href');
                const text = link.textContent?.trim();
                if (href && text) {
                    structure.links.push({
                        text: text,
                        href: href
                    });
                }
            });
            
            return {
                title,
                description,
                url: window.location.href,
                timestamp: new Date().toISOString(),
                articles,
                navLinks,
                structure,
                bodyText: document.body?.innerText?.trim() || ''
            };
        });
        
        console.log(`✅ 成功提取到 ${pageData.articles.length} 篇文章内容`);
        console.log(`📋 标题: ${pageData.title}`);
        
        // 保存数据到文件
        const outputDir = path.join(__dirname, 'output');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // 保存 JSON 格式数据
        const jsonFile = path.join(outputDir, `mcpservers-${Date.now()}.json`);
        fs.writeFileSync(jsonFile, JSON.stringify(pageData, null, 2), 'utf8');
        
        // 保存纯文本格式
        const textFile = path.join(outputDir, `mcpservers-${Date.now()}.txt`);
        let textContent = `=== MCP Servers 网站爬取结果 ===\n\n`;
        textContent += `网站标题: ${pageData.title}\n`;
        textContent += `网站描述: ${pageData.description}\n`;
        textContent += `爬取时间: ${pageData.timestamp}\n`;
        textContent += `目标URL: ${pageData.url}\n\n`;
        
        textContent += `=== 文章内容 (${pageData.articles.length}篇) ===\n\n`;
        pageData.articles.forEach((article, index) => {
            textContent += `${index + 1}. ${article.title}\n`;
            textContent += `   链接: ${article.link}\n`;
            textContent += `   摘要: ${article.excerpt}\n`;
            textContent += `   日期: ${article.date}\n`;
            textContent += `   作者: ${article.author}\n`;
            textContent += `   分类: ${article.category}\n\n`;
        });
        
        textContent += `=== 页面结构信息 ===\n\n`;
        textContent += `标题层级 (${pageData.structure.headings.length}个):\n`;
        pageData.structure.headings.forEach(heading => {
            textContent += `  ${heading.tag}: ${heading.text}\n`;
        });
        
        textContent += `\n导航链接 (${pageData.navLinks.length}个):\n`;
        pageData.navLinks.forEach(link => {
            textContent += `  ${link.text}: ${link.href}\n`;
        });
        
        fs.writeFileSync(textFile, textContent, 'utf8');
        
        console.log(`📁 数据已保存到:`);
        console.log(`   JSON: ${jsonFile}`);
        console.log(`   TXT:  ${textFile}`);
        
        return {
            success: true,
            data: pageData,
            files: {
                json: jsonFile,
                text: textFile
            }
        };
        
    } catch (error) {
        console.error('❌ 爬取过程中出现错误:', error.message);
        return {
            success: false,
            error: error.message
        };
    } finally {
        if (browser) {
            await browser.close();
            console.log('🔚 浏览器已关闭');
        }
    }
}

/**
 * 显示爬取结果摘要
 */
function displaySummary(result) {
    if (result.success) {
        console.log('\n🎉 爬取完成！结果摘要:');
        console.log(`📄 标题: ${result.data.title}`);
        console.log(`📝 文章数量: ${result.data.articles.length}`);
        console.log(`🔗 导航链接: ${result.data.navLinks.length}`);
        console.log(`🖼️ 图片数量: ${result.data.structure.images.length}`);
        console.log(`🔗 总链接数: ${result.data.structure.links.length}`);
        console.log(`📊 页面文本长度: ${result.data.bodyText.length} 字符`);
        
        if (result.data.articles.length > 0) {
            console.log('\n📚 前几篇文章预览:');
            result.data.articles.slice(0, 3).forEach((article, index) => {
                console.log(`${index + 1}. ${article.title}`);
                console.log(`   ${article.excerpt.substring(0, 100)}...`);
            });
        }
    } else {
        console.log('\n❌ 爬取失败:', result.error);
    }
}

// 执行爬虫
if (require.main === module) {
    scrapeMcpServers()
        .then(result => {
            displaySummary(result);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 程序执行出错:', error);
            process.exit(1);
        });
}

module.exports = { scrapeMcpServers, displaySummary };