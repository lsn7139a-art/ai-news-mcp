const fs = require('fs');
const puppeteer = require('puppeteer');

async function scrapeXiaohongshuWithPuppeteer() {
    console.log('=== 小红书探索页面Puppeteer爬虫 ===');
    console.log('目标网址: https://www.xiaohongshu.com/explore\n');
    
    const targetUrl = 'https://www.xiaohongshu.com/explore';
    
    let browser;
    try {
        // 1. 启动Puppeteer浏览器
        console.log('🚀 正在启动浏览器...');
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--disable-features=IsolateOrigins,site-per-process',
                '--window-size=1920,1080',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ]
        });
        
        const page = await browser.newPage();
        
        // 设置用户代理和视口
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1920, height: 1080 });
        
        // 2. 导航到目标页面
        console.log('📡 正在访问小红书探索页面...');
        await page.goto(targetUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        console.log('✅ 页面加载成功');
        
        // 3. 等待动态内容加载
        console.log('⏳ 等待页面内容加载...');
        try {
            // 等待可能的帖子容器加载
            await page.waitForSelector('[class*="note"], [class*="card"], [class*="item"], [class*="feed"], [class*="post"]', {
                timeout: 10000
            });
        } catch (e) {
            console.log('⚠️  未找到标准的帖子容器，尝试等待更长时间...');
            // 额外等待时间让JavaScript渲染完成
            await page.waitForTimeout(5000);
        }
        
        // 4. 滚动页面以加载更多内容
        console.log('📜 正在滚动页面加载更多内容...');
        for (let i = 0; i < 3; i++) {
            await page.evaluate(() => {
                window.scrollTo(0, document.body.scrollHeight);
            });
            await page.waitForTimeout(2000);
        }
        
        // 5. 获取页面标题
        const pageTitle = await page.title();
        console.log(`📊 页面标题: ${pageTitle}`);
        
        // 6. 提取帖子数据
        console.log('🔍 正在提取帖子数据...');
        const posts = await page.evaluate(() => {
            const extractedPosts = [];
            
            // 尝试多种选择器来找到帖子
            const selectors = [
                '[class*="note"]',
                '[class*="card"]',
                '[class*="item"]',
                '[class*="feed"]',
                '[class*="post"]',
                '[class*="content"]',
                'a[href*="/explore/"]',
                'div[class*="explore"]',
                'section[class*="explore"]'
            ];
            
            const allElements = [];
            
            // 收集所有可能的元素
            selectors.forEach(selector => {
                try {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(el => allElements.push(el));
                } catch (e) {
                    // 忽略选择器错误
                }
            });
            
            // 从每个元素中提取文本和可能的点赞数
            allElements.forEach((element, index) => {
                const text = element.textContent || element.innerText || '';
                
                // 过滤掉太短或太长的文本，以及明显不是帖子的内容
                if (text.length > 5 && text.length < 200 && 
                    !text.match(/^(沪ICP备|2024沪公网安备|增值电信业务|违法不良信息举报)/) &&
                    !text.match(/^(登录|注册|首页|探索|消息|我的)/)) {
                    
                    // 尝试提取点赞数
                    let likes = 0;
                    const likeTexts = element.querySelectorAll('[class*="like"], [class*="heart"], [class*="count"], [class*="number"]');
                    
                    likeTexts.forEach(likeEl => {
                        const likeText = likeEl.textContent || '';
                        const likeMatch = likeText.match(/(\d+(?:\.\d+)?[kKwW万]?)/);
                        if (likeMatch) {
                            const number = parseFloat(likeMatch[1]);
                            if (likeText.toLowerCase().includes('k') || likeText.toLowerCase().includes('w')) {
                                likes = Math.max(likes, Math.round(number * 1000));
                            } else if (likeText.includes('万')) {
                                likes = Math.max(likes, Math.round(number * 10000));
                            } else {
                                likes = Math.max(likes, Math.round(number));
                            }
                        }
                    });
                    
                    // 从元素文本中直接查找点赞数
                    if (likes === 0) {
                        const textLikeMatch = text.match(/(\d+(?:\.\d+)?[kKwW万]?)\s*(?:赞|like|heart|喜欢)/i);
                        if (textLikeMatch) {
                            const number = parseFloat(textLikeMatch[1]);
                            if (textLikeMatch[1].toLowerCase().includes('k') || textLikeMatch[1].toLowerCase().includes('w')) {
                                likes = Math.round(number * 1000);
                            } else if (textLikeMatch[1].includes('万')) {
                                likes = Math.round(number * 10000);
                            } else {
                                likes = Math.round(number);
                            }
                        }
                    }
                    
                    // 如果看起来像帖子标题，添加到结果中
                    if (text.match(/[一-龯]/) || text.match(/[a-zA-Z]/)) { // 包含中文或英文
                        extractedPosts.push({
                            id: extractedPosts.length + 1,
                            title: text.trim().replace(/\s+/g, ' ').substring(0, 100),
                            likes: likes,
                            likeText: likes > 0 ? `${likes} 赞` : '未找到点赞数',
                            elementTag: element.tagName.toLowerCase(),
                            elementClass: element.className || '',
                            extractionMethod: 'puppeteer-dom'
                        });
                    }
                }
            });
            
            // 去重：移除重复的标题
            const uniquePosts = [];
            const seenTitles = new Set();
            
            extractedPosts.forEach(post => {
                const titleKey = post.title.substring(0, 30);
                if (!seenTitles.has(titleKey) && post.title.length > 10) {
                    uniquePosts.push(post);
                    seenTitles.add(titleKey);
                }
            });
            
            return uniquePosts;
        });
        
        // 7. 尝试从页面脚本中提取JSON数据
        console.log('🔍 正在提取JSON数据...');
        const scriptData = await page.evaluate(() => {
            const scripts = document.querySelectorAll('script');
            const jsonData = [];
            
            scripts.forEach(script => {
                const content = script.textContent || '';
                
                // 查找包含帖子数据的JSON
                const jsonMatches = content.match(/\{[^{}]*"title"[^{}]*\}/g);
                if (jsonMatches) {
                    jsonMatches.forEach(jsonStr => {
                        try {
                            const data = JSON.parse(jsonStr);
                            if (data.title && typeof data.title === 'string' && data.title.length > 5) {
                                jsonData.push({
                                    title: data.title,
                                    likes: data.likes || data.like_count || data.heart_count || data.likeCount || 0,
                                    views: data.views || data.view_count || data.viewCount || 0,
                                    url: data.url || data.link || '',
                                    extractionMethod: 'script-json'
                                });
                            }
                        } catch (e) {
                            // 忽略解析错误
                        }
                    });
                }
            });
            
            return jsonData;
        });
        
        // 合并所有数据
        const allPosts = [...posts, ...scriptData];
        
        // 按点赞数排序并限制数量
        const sortedPosts = allPosts
            .sort((a, b) => b.likes - a.likes)
            .slice(0, 50);
        
        // 8. 创建数据报告
        const report = {
            summary: {
                url: targetUrl,
                timestamp: new Date().toISOString(),
                title: pageTitle,
                totalPosts: sortedPosts.length,
                postsWithLikes: sortedPosts.filter(p => p.likes > 0).length,
                scrapingMethod: 'puppeteer + dom parsing',
                browser: 'chromium'
            },
            posts: sortedPosts,
            statistics: generateStatistics(sortedPosts)
        };
        
        // 9. 保存数据
        const jsonFileName = `xiaohongshu-puppeteer-${Date.now()}.json`;
        fs.writeFileSync(jsonFileName, JSON.stringify(report, null, 2), 'utf8');
        
        // 10. 生成可读性报告
        const readableReport = generateReadableReport(report);
        const markdownFileName = `xiaohongshu-puppeteer-${Date.now()}.md`;
        fs.writeFileSync(markdownFileName, readableReport, 'utf8');
        
        // 11. 显示结果
        displayResults(report);
        
        console.log(`\n📄 数据文件已保存:`);
        console.log(`   JSON格式: ${jsonFileName}`);
        console.log(`   Markdown格式: ${markdownFileName}`);
        
        return report;
        
    } catch (error) {
        console.error('❌ 爬取过程中出现错误:', error.message);
        throw error;
    } finally {
        // 关闭浏览器
        if (browser) {
            await browser.close();
            console.log('🔒 浏览器已关闭');
        }
    }
}

// 生成统计信息
function generateStatistics(posts) {
    const likes = posts.map(p => p.likes).filter(l => l > 0);
    const extractionMethods = {};
    
    posts.forEach(post => {
        extractionMethods[post.extractionMethod] = (extractionMethods[post.extractionMethod] || 0) + 1;
    });
    
    return {
        totalPosts: posts.length,
        postsWithLikes: likes.length,
        postsWithoutLikes: posts.length - likes.length,
        totalLikes: likes.reduce((sum, likes) => sum + likes, 0),
        averageLikes: likes.length > 0 ? Math.round(likes.reduce((sum, likes) => sum + likes, 0) / likes.length) : 0,
        maxLikes: likes.length > 0 ? Math.max(...likes) : 0,
        minLikes: likes.length > 0 ? Math.min(...likes) : 0,
        extractionMethods: extractionMethods,
        averageTitleLength: Math.round(posts.reduce((sum, p) => sum + p.title.length, 0) / posts.length)
    };
}

// 生成可读性报告
function generateReadableReport(report) {
    return `# 小红书探索页面Puppeteer爬取报告

## 基本信息

- **网站标题**: ${report.summary.title}
- **爬取时间**: ${new Date(report.summary.timestamp).toLocaleString('zh-CN')}
- **目标网址**: ${report.summary.url}
- **爬取方法**: ${report.summary.scrapingMethod}
- **浏览器**: ${report.summary.browser}

## 统计摘要

- **总帖子数**: ${report.statistics.totalPosts}
- **有点赞数据的帖子**: ${report.statistics.postsWithLikes}
- **无点赞数据的帖子**: ${report.statistics.postsWithoutLikes}
- **总点赞数**: ${report.statistics.totalLikes.toLocaleString()}
- **平均点赞数**: ${report.statistics.averageLikes.toLocaleString()}
- **最高点赞数**: ${report.statistics.maxLikes.toLocaleString()}
- **最低点赞数**: ${report.statistics.minLikes.toLocaleString()}
- **平均标题长度**: ${report.statistics.averageTitleLength} 字符

## 提取方法分布

${Object.entries(report.statistics.extractionMethods)
    .map(([method, count]) => `- **${method}**: ${count} 个帖子`)
    .join('\n')}

## 帖子列表 (按点赞数排序)

${report.posts.slice(0, 20).map((post, index) => `
### ${index + 1}. ${post.title}

- **点赞数**: ${post.likes.toLocaleString()}
- **点赞文本**: ${post.likeText || '无数据'}
- **提取方法**: ${post.extractionMethod}
${post.elementTag ? `- **元素标签**: ${post.elementTag}` : ''}
${post.elementClass ? `- **元素类名**: ${post.elementClass}` : ''}
`).join('')}

${report.posts.length > 20 ? `\n... 还有 ${report.posts.length - 20} 个帖子，详见JSON文件` : ''}

## 点赞数分布

### 🏆 高赞帖子 (点赞数 > 1000)
${report.posts.filter(p => p.likes > 1000).map(p => `- **${p.title}**: ${p.likes.toLocaleString()} 赞`).join('\n') || '无高赞帖子'}

### 🔥 热门帖子 (点赞数 100-1000)
${report.posts.filter(p => p.likes >= 100 && p.likes <= 1000).slice(0, 10).map(p => `- **${p.title}**: ${p.likes.toLocaleString()} 赞`).join('\n') || '无热门帖子'}

### 📝 普通帖子 (点赞数 < 100)
${report.posts.filter(p => p.likes < 100).slice(0, 10).map(p => `- **${p.title}**: ${p.likes.toLocaleString()} 赞`).join('\n') || '无普通帖子'}

---

*报告生成时间: ${new Date().toLocaleString('zh-CN')}*
*数据来源: ${report.summary.url}*
*爬取工具: 小红书探索页面Puppeteer爬虫 v1.0*
`;
}

// 显示结果
function displayResults(report) {
    console.log('🎉 爬取完成！结果摘要:');
    console.log('=' .repeat(50));
    console.log(`📊 页面标题: ${report.summary.title}`);
    console.log(`📝 总帖子数: ${report.statistics.totalPosts}`);
    console.log(`❤️  有点赞数据: ${report.statistics.postsWithLikes} 个`);
    console.log(`📝 无点赞数据: ${report.statistics.postsWithoutLikes} 个`);
    console.log(`🔢 总点赞数: ${report.statistics.totalLikes.toLocaleString()}`);
    console.log(`📈 平均点赞: ${report.statistics.averageLikes.toLocaleString()}`);
    console.log(`🏆 最高点赞: ${report.statistics.maxLikes.toLocaleString()}`);
    console.log(`📏 平均标题长度: ${report.statistics.averageTitleLength} 字符`);
    
    console.log('\n📊 提取方法分布:');
    Object.entries(report.statistics.extractionMethods).forEach(([method, count]) => {
        console.log(`   ${method}: ${count} 个帖子`);
    });
    
    console.log('\n🏆 前5个高赞帖子:');
    report.posts.slice(0, 5).forEach((post, index) => {
        console.log(`   ${index + 1}. ${post.title.substring(0, 40)}... (${post.likes.toLocaleString()} 赞)`);
    });
}

// 运行爬虫
if (require.main === module) {
    scrapeXiaohongshuWithPuppeteer()
        .then(() => {
            console.log('\n✅ 小红书探索页面Puppeteer爬取完成！');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ 爬取失败:', error.message);
            process.exit(1);
        });
}

module.exports = { scrapeXiaohongshuWithPuppeteer };