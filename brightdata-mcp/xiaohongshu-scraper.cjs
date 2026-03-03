const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeXiaohongshuExplore() {
    console.log('=== 小红书探索页面爬虫 ===');
    console.log('目标网址: https://www.xiaohongshu.com/explore\n');
    
    const targetUrl = 'https://www.xiaohongshu.com/explore';
    
    try {
        // 1. 获取网页内容
        console.log('📡 正在获取小红书探索页面内容...');
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Referer': 'https://www.xiaohongshu.com/',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 30000,
            maxRedirects: 5
        });
        
        console.log('✅ 页面内容获取成功');
        console.log(`   状态码: ${response.status}`);
        console.log(`   内容大小: ${response.data.length} 字符\n`);
        
        // 2. 解析页面内容
        const html = response.data;
        const posts = extractPosts(html);
        
        // 3. 创建数据报告
        const report = {
            summary: {
                url: targetUrl,
                timestamp: new Date().toISOString(),
                title: extractPageTitle(html),
                totalPosts: posts.length,
                scrapingMethod: 'axios + cheerio'
            },
            posts: posts,
            statistics: generateStatistics(posts)
        };
        
        // 4. 保存数据
        const jsonFileName = `xiaohongshu-explore-${Date.now()}.json`;
        fs.writeFileSync(jsonFileName, JSON.stringify(report, null, 2), 'utf8');
        
        // 5. 生成可读性报告
        const readableReport = generateReadableReport(report);
        const markdownFileName = `xiaohongshu-explore-${Date.now()}.md`;
        fs.writeFileSync(markdownFileName, readableReport, 'utf8');
        
        // 6. 显示结果
        displayResults(report);
        
        console.log(`\n📄 数据文件已保存:`);
        console.log(`   JSON格式: ${jsonFileName}`);
        console.log(`   Markdown格式: ${markdownFileName}`);
        
        return report;
        
    } catch (error) {
        console.error('❌ 爬取过程中出现错误:', error.message);
        if (error.response) {
            console.error(`   HTTP状态码: ${error.response.status}`);
            console.error(`   响应头: ${JSON.stringify(error.response.headers, null, 2)}`);
        }
        throw error;
    }
}

// 提取页面标题
function extractPageTitle(html) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : '小红书探索页面';
}

// 提取帖子信息
function extractPosts(html) {
    const posts = [];
    
    // 尝试多种可能的HTML结构来提取帖子信息
    
    // 方法1: 查找包含标题和点赞数的容器
    const titleRegex = /<[^>]*(?:title|caption|content|text)[^>]*>([^<]{10,100})<\/[^>]*>/gi;
    const likeRegex = /<[^>]*(?:like|heart|点赞|赞|count)[^>]*(?:\d+(?:\.\d+)?[kKwW万]?\s*(?:赞|like|heart)?|\d+(?:\.\d+)?[kKwW万]?)[^>]*>/gi;
    
    // 提取所有可能的标题
    const titles = [];
    let titleMatch;
    while ((titleMatch = titleRegex.exec(html)) !== null) {
        const title = titleMatch[1].trim()
            .replace(/[\r\n\t]/g, ' ')
            .replace(/\s+/g, ' ');
        if (title.length > 5 && title.length < 100 && !title.match(/^[0-9\s]+$/)) {
            titles.push({
                text: title,
                position: titleMatch.index
            });
        }
    }
    
    // 提取所有可能的点赞数
    const likes = [];
    let likeMatch;
    while ((likeMatch = likeRegex.exec(html)) !== null) {
        const likeText = likeMatch[0];
        const likeNumber = extractLikeNumber(likeText);
        if (likeNumber > 0) {
            likes.push({
                number: likeNumber,
                text: likeText,
                position: likeMatch.index
            });
        }
    }
    
    // 尝试匹配标题和点赞数
    const usedLikes = new Set();
    titles.forEach((title, titleIndex) => {
        // 寻找距离最近的点赞数
        let closestLike = null;
        let minDistance = Infinity;
        
        likes.forEach((like, likeIndex) => {
            if (!usedLikes.has(likeIndex)) {
                const distance = Math.abs(like.position - title.position);
                if (distance < minDistance && distance < 500) { // 500字符范围内
                    minDistance = distance;
                    closestLike = like;
                }
            }
        });
        
        if (closestLike) {
            posts.push({
                id: titleIndex + 1,
                title: title.text,
                likes: closestLike.number,
                likeText: closestLike.text,
                extractionMethod: 'pattern-matching'
            });
            usedLikes.add(likes.indexOf(closestLike));
        } else {
            // 如果没有找到匹配的点赞数，仍然添加标题
            posts.push({
                id: titleIndex + 1,
                title: title.text,
                likes: 0,
                likeText: '未找到点赞数',
                extractionMethod: 'title-only'
            });
        }
    });
    
    // 方法2: 尝试使用JSON数据提取
    try {
        const jsonMatches = html.match(/\{[^{}]*"title"[^{}]*\}/gi);
        if (jsonMatches) {
            jsonMatches.forEach((jsonStr, index) => {
                try {
                    const data = JSON.parse(jsonStr);
                    if (data.title && data.title.length > 5) {
                        posts.push({
                            id: posts.length + 1,
                            title: data.title,
                            likes: data.likes || data.like_count || data.heart_count || 0,
                            likeText: data.likes ? `JSON数据: ${data.likes}` : '无点赞数据',
                            extractionMethod: 'json-parsing'
                        });
                    }
                } catch (e) {
                    // 忽略解析错误
                }
            });
        }
    } catch (e) {
        // 忽略JSON解析错误
    }
    
    // 去重和清理
    const uniquePosts = [];
    const seenTitles = new Set();
    
    posts.forEach(post => {
        const titleKey = post.title.substring(0, 50);
        if (!seenTitles.has(titleKey)) {
            uniquePosts.push(post);
            seenTitles.add(titleKey);
        }
    });
    
    // 按点赞数排序
    return uniquePosts.sort((a, b) => b.likes - a.likes).slice(0, 50); // 只返回前50个
}

// 从文本中提取点赞数字
function extractLikeNumber(text) {
    // 匹配各种格式的数字: 123, 1.2k, 1.2w, 1万, 1234等
    const numberMatch = text.match(/(\d+(?:\.\d+)?[kKwW万]?)/);
    if (!numberMatch) return 0;
    
    const numberStr = numberMatch[1].toLowerCase();
    let number = parseFloat(numberStr);
    
    if (numberStr.includes('k') || numberStr.includes('w')) {
        number *= 1000;
    } else if (numberStr.includes('万')) {
        number *= 10000;
    }
    
    return Math.round(number);
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
    return `# 小红书探索页面爬取报告

## 基本信息

- **网站标题**: ${report.summary.title}
- **爬取时间**: ${new Date(report.summary.timestamp).toLocaleString('zh-CN')}
- **目标网址**: ${report.summary.url}
- **爬取方法**: ${report.summary.scrapingMethod}

## 统计摘要

- **总帖子数**: ${report.statistics.totalPosts}
- **有点赞数据的帖子**: ${report.statistics.postsWithLikes}
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
- **点赞文本**: ${post.likeText}
- **提取方法**: ${post.extractionMethod}
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
*爬取工具: 小红书探索页面爬虫 v1.0*
`;
}

// 显示结果
function displayResults(report) {
    console.log('🎉 爬取完成！结果摘要:');
    console.log('=' .repeat(50));
    console.log(`📊 页面标题: ${report.summary.title}`);
    console.log(`📝 总帖子数: ${report.statistics.totalPosts}`);
    console.log(`❤️  有点赞数据: ${report.statistics.postsWithLikes} 个`);
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
        console.log(`   ${index + 1}. ${post.title.substring(0, 30)}... (${post.likes.toLocaleString()} 赞)`);
    });
}

// 运行爬虫
if (require.main === module) {
    scrapeXiaohongshuExplore()
        .then(() => {
            console.log('\n✅ 小红书探索页面爬取完成！');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ 爬取失败:', error.message);
            process.exit(1);
        });
}

module.exports = { scrapeXiaohongshuExplore };