import axios from 'axios';
import cheerio from 'cheerio';

class NewsService {
  constructor() {
    this.sources = [
      // 主要AI公司官方博客
      {
        name: 'OpenAI Blog',
        url: 'https://openai.com/blog',
        selector: '.blog-card, article',
        titleSelector: 'h3, h2',
        linkSelector: 'a',
        dateSelector: '.date, time',
        category: 'technology'
      },
      {
        name: 'DeepMind Blog',
        url: 'https://deepmind.com/blog',
        selector: '.blog-post, article',
        titleSelector: 'h2, h3',
        linkSelector: 'a',
        dateSelector: '.date, time',
        category: 'technology'
      },
      {
        name: 'Google AI Blog',
        url: 'https://ai.googleblog.com/',
        selector: '.post',
        titleSelector: 'h2, h3',
        linkSelector: 'a',
        dateSelector: '.date, .published',
        category: 'technology'
      },
      {
        name: 'Meta AI Blog',
        url: 'https://ai.meta.com/blog/',
        selector: '.blog-post, article',
        titleSelector: 'h2, h3',
        linkSelector: 'a',
        dateSelector: '.date, time',
        category: 'technology'
      },
      {
        name: 'Anthropic Blog',
        url: 'https://www.anthropic.com/news',
        selector: '.news-item, article',
        titleSelector: 'h2, h3',
        linkSelector: 'a',
        dateSelector: '.date, time',
        category: 'technology'
      },
      
      // 专业AI新闻媒体
      {
        name: 'VentureBeat AI',
        url: 'https://venturebeat.com/ai/',
        selector: '.article, .post',
        titleSelector: 'h2, h3',
        linkSelector: 'a',
        dateSelector: '.date, .byline, time',
        category: 'news'
      },
      {
        name: 'Ars Technica AI',
        url: 'https://arstechnica.com/ai/',
        selector: '.article, .listing',
        titleSelector: 'h2, h3',
        linkSelector: 'a',
        dateSelector: '.date, .byline, time',
        category: 'news'
      },
      {
        name: 'MIT Technology Review AI',
        url: 'https://www.technologyreview.com/topic/artificial-intelligence/',
        selector: '.article, .story',
        titleSelector: 'h2, h3',
        linkSelector: 'a',
        dateSelector: '.date, .byline, time',
        category: 'research'
      },
      
      // 综合科技媒体AI版块
      {
        name: 'TechCrunch AI',
        url: 'https://techcrunch.com/category/artificial-intelligence/',
        selector: '.post-block, .article',
        titleSelector: 'h2',
        linkSelector: 'a',
        dateSelector: '.river-byline, .date',
        category: 'news'
      },
      {
        name: 'The Verge AI',
        url: 'https://www.theverge.com/artificial-intelligence',
        selector: '.c-entry-box--compact, .article',
        titleSelector: 'h2, h3',
        linkSelector: 'a',
        dateSelector: '.c-byline, .date',
        category: 'news'
      },
      {
        name: 'Wired AI',
        url: 'https://www.wired.com/tag/artificial-intelligence/',
        selector: '.article, .story',
        titleSelector: 'h2, h3',
        linkSelector: 'a',
        dateSelector: '.date, .byline, time',
        category: 'news'
      }
    ];
  }

  async fetchLatestNews() {
    const news = [];
    
    for (const source of this.sources) {
      try {
        const response = await axios.get(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 10000
        });
        
        const $ = cheerio.load(response.data);
        const articles = $(source.selector).slice(0, 5);
        
        articles.each((index, element) => {
          const title = $(element).find(source.titleSelector).text().trim();
          const link = $(element).find(source.linkSelector).attr('href');
          const date = $(element).find(source.dateSelector).text().trim();
          
          if (title && link) {
            const newsItem = {
              title,
              link: link.startsWith('http') ? link : new URL(link, source.url).href,
              date: this.parseDate(date),
              source: source.name,
              category: source.category,
              importance: this.calculateImportance(title, source.category)
            };
            
            // 只获取过去24小时的新闻
            if (this.isWithinLast24Hours(newsItem.date)) {
              news.push(newsItem);
            }
          }
        });
      } catch (error) {
        console.error(`获取${source.name}新闻失败:`, error.message);
      }
    }
    
    // 按重要性和时间排序
    return news.sort((a, b) => {
      if (b.importance !== a.importance) {
        return b.importance - a.importance;
      }
      return new Date(b.date) - new Date(a.date);
    });
  }

  async fetchTechNews() {
    const techSources = [
      {
        name: 'TechCrunch',
        url: 'https://techcrunch.com',
        selector: '.post-block',
        titleSelector: 'h2',
        linkSelector: 'a',
        dateSelector: '.river-byline'
      },
      {
        name: 'The Verge - Tech',
        url: 'https://www.theverge.com/tech',
        selector: '.c-entry-box--compact',
        titleSelector: 'h2',
        linkSelector: 'a',
        dateSelector: '.c-byline'
      }
    ];

    const techNews = [];
    
    for (const source of techSources) {
      try {
        const response = await axios.get(source.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        const $ = cheerio.load(response.data);
        const articles = $(source.selector).slice(0, 3);
        
        articles.each((index, element) => {
          const title = $(element).find(source.titleSelector).text().trim();
          const link = $(element).find(source.linkSelector).attr('href');
          const date = $(element).find(source.dateSelector).text().trim();
          
          if (title && link) {
            techNews.push({
              title,
              link: link.startsWith('http') ? link : `${source.url}${link}`,
              date,
              source: source.name
            });
          }
        });
      } catch (error) {
        console.error(`获取${source.name}科技新闻失败:`, error.message);
      }
    }
    
    return techNews;
  }

  // 添加辅助方法
  parseDate(dateString) {
    if (!dateString) return new Date();
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // 如果无法解析，返回当前时间
      return new Date();
    }
    return date;
  }

  isWithinLast24Hours(date) {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return date >= twentyFourHoursAgo;
  }

  calculateImportance(title, category) {
    const highImportanceKeywords = [
      '发布', '推出', '更新', '升级', '突破', '重大', '融资', '收购', '并购',
      'GPT', 'Claude', 'Gemini', 'LLaMA', '模型', '监管', '政策', '禁令'
    ];
    
    const mediumImportanceKeywords = [
      '合作', '投资', '研究', '开发', '测试', '开源', '版本', '功能'
    ];

    const titleLower = title.toLowerCase();
    
    if (highImportanceKeywords.some(keyword => titleLower.includes(keyword.toLowerCase()))) {
      return 10;
    }
    
    if (mediumImportanceKeywords.some(keyword => titleLower.includes(keyword.toLowerCase()))) {
      return 7;
    }
    
    // 根据分类给予基础重要性
    switch (category) {
      case 'technology':
        return 8;
      case 'news':
        return 6;
      case 'research':
        return 5;
      default:
        return 4;
    }
  }

  // 新闻分类和过滤
  categorizeNews(news) {
    const categories = {
      techGiants: [], // 大型科技公司新闻
      modelProgress: [], // 大模型技术进展
      policyRegulation: [], // 政策监管动态
      fundingMergers: [], // 大额融资与并购
      developerUpdates: [] // 开发者功能更新
    };

    news.forEach(item => {
      const titleLower = item.title.toLowerCase();
      
      if (titleLower.includes('openai') || titleLower.includes('google') || 
          titleLower.includes('meta') || titleLower.includes('microsoft') ||
          titleLower.includes('anthropic') || titleLower.includes('deepmind')) {
        categories.techGiants.push(item);
      } else if (titleLower.includes('gpt') || titleLower.includes('claude') || 
                 titleLower.includes('gemini') || titleLower.includes('llama') ||
                 titleLower.includes('模型') || titleLower.includes('model')) {
        categories.modelProgress.push(item);
      } else if (titleLower.includes('监管') || titleLower.includes('政策') || 
                 titleLower.includes('禁令') || titleLower.includes('regulation')) {
        categories.policyRegulation.push(item);
      } else if (titleLower.includes('融资') || titleLower.includes('收购') || 
                 titleLower.includes('并购') || titleLower.includes('投资') ||
                 titleLower.includes('funding') || titleLower.includes('acquisition')) {
        categories.fundingMergers.push(item);
      } else if (titleLower.includes('api') || titleLower.includes('开发者') || 
                 titleLower.includes('版本') || titleLower.includes('更新')) {
        categories.developerUpdates.push(item);
      }
    });

    return categories;
  }

  // 生成新闻摘要
  generateSummary(news) {
    const categories = this.categorizeNews(news);
    const summary = {
      headlines: [],
      analysis: {},
      keyImpacts: []
    };

    // 生成标题摘要（5-10条重要新闻）
    const topNews = news.slice(0, 8);
    summary.headlines = topNews.map(item => ({
      title: item.title,
      summary: this.extractKeyInfo(item.title),
      source: item.source,
      importance: item.importance
    }));

    // 按主题分析
    Object.keys(categories).forEach(category => {
      if (categories[category].length > 0) {
        summary.analysis[category] = {
          count: categories[category].length,
          items: categories[category].slice(0, 3), // 每类最多3条
          trend: this.analyzeTrend(categories[category])
        };
      }
    });

    // 总结关键影响（3-5条）
    summary.keyImpacts = this.identifyKeyImpacts(news);

    return summary;
  }

  extractKeyInfo(title) {
    // 简单的关键信息提取
    if (title.length > 50) {
      return title.substring(0, 47) + '...';
    }
    return title;
  }

  analyzeTrend(newsItems) {
    if (newsItems.length === 0) return '无数据';
    
    const latestDate = Math.max(...newsItems.map(item => new Date(item.date).getTime()));
    const now = new Date().getTime();
    const hoursDiff = (now - latestDate) / (1000 * 60 * 60);
    
    if (hoursDiff < 6) return '非常活跃';
    if (hoursDiff < 12) return '活跃';
    if (hoursDiff < 24) return '正常';
    return '较少';
  }

  identifyKeyImpacts(news) {
    const impacts = [];
    const topNews = news.slice(0, 10);
    
    // 识别不同类型的影响
    if (topNews.some(item => item.title.toLowerCase().includes('发布'))) {
      impacts.push('新产品发布可能改变市场格局');
    }
    
    if (topNews.some(item => item.title.toLowerCase().includes('融资'))) {
      impacts.push('大额融资显示资本市场对AI的持续关注');
    }
    
    if (topNews.some(item => item.title.toLowerCase().includes('监管'))) {
      impacts.push('政策监管变化将影响行业发展方向');
    }
    
    if (topNews.some(item => item.title.toLowerCase().includes('模型'))) {
      impacts.push('模型技术进步推动应用场景扩展');
    }
    
    if (impacts.length === 0) {
      impacts.push('今日新闻整体显示行业稳步发展');
    }
    
    return impacts.slice(0, 4);
  }
}

export default NewsService;
