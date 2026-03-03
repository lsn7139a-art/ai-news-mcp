import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.qq.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  formatNewsHTML(news, techNews) {
    // 生成新闻摘要
    const summary = this.generateNewsSummary(news);
    
    let html = `
      <html>
      <head>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Microsoft YaHei', sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
          }
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 10px;
            margin-bottom: 30px;
          }
          .content { padding: 0 10px; }
          .section { 
            margin-bottom: 40px; 
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .section-title { 
            background: #f8f9fa; 
            padding: 15px 20px; 
            margin: 0;
            border-bottom: 2px solid #e9ecef;
            font-size: 18px;
            font-weight: 600;
          }
          .headline-item { 
            border-bottom: 1px solid #f0f0f0; 
            padding: 20px; 
            transition: background-color 0.2s;
          }
          .headline-item:hover { 
            background-color: #f8f9fa; 
          }
          .headline-title { 
            font-size: 16px; 
            font-weight: 600; 
            margin-bottom: 8px;
            line-height: 1.4;
          }
          .headline-title a { 
            color: #2c3e50; 
            text-decoration: none;
          }
          .headline-title a:hover { 
            color: #3498db; 
          }
          .headline-summary { 
            color: #7f8c8d; 
            font-size: 14px; 
            margin-bottom: 8px;
          }
          .headline-meta { 
            color: #95a5a6; 
            font-size: 12px; 
          }
          .category-section {
            padding: 20px;
          }
          .category-title {
            font-size: 16px;
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #3498db;
          }
          .category-item {
            margin-bottom: 12px;
            padding-left: 15px;
            position: relative;
          }
          .category-item:before {
            content: "•";
            color: #3498db;
            font-weight: bold;
            position: absolute;
            left: 0;
          }
          .category-item a {
            color: #2c3e50;
            text-decoration: none;
            font-size: 14px;
          }
          .category-item a:hover {
            color: #3498db;
          }
          .category-meta {
            color: #95a5a6;
            font-size: 11px;
            margin-top: 4px;
          }
          .impact-list {
            padding: 20px;
          }
          .impact-item {
            background: #e8f4fd;
            border-left: 4px solid #3498db;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 0 4px 4px 0;
          }
          .impact-item strong {
            color: #2c3e50;
          }
          .footer { 
            text-align: center; 
            color: #95a5a6; 
            font-size: 12px; 
            margin-top: 40px;
            padding: 20px;
            border-top: 1px solid #e9ecef;
          }
          .trend-badge {
            display: inline-block;
            background: #27ae60;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            margin-left: 10px;
          }
          .trend-badge.active { background: #e74c3c; }
          .trend-badge.normal { background: #f39c12; }
          .trend-badge.low { background: #95a5a6; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🤖 人工智能与大模型行业日报</h1>
          <p>📅 ${new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
          <p>📍 过去24小时重要新闻整理</p>
        </div>
        
        <div class="content">
    `;

    // 1. 重要新闻标题摘要 (5-10条)
    html += `
        <div class="section">
          <h2 class="section-title">📈 今日重要新闻</h2>
    `;
    
    summary.headlines.forEach((item, index) => {
      html += `
          <div class="headline-item">
            <div class="headline-title">
              <a href="${item.link}" target="_blank">${index + 1}. ${item.title}</a>
            </div>
            <div class="headline-summary">${item.summary}</div>
            <div class="headline-meta">
              📰 ${item.source} | ⭐ 重要性: ${item.importance}/10
            </div>
          </div>
      `;
    });
    
    html += `
        </div>
    `;

    // 2. 按主题分类分析
    html += `
        <div class="section">
          <h2 class="section-title">🔍 主题分类分析</h2>
    `;
    
    Object.keys(summary.analysis).forEach(category => {
      const categoryInfo = summary.analysis[category];
      const categoryNames = {
        techGiants: '🏢 大型科技公司',
        modelProgress: '🧠 大模型技术进展',
        policyRegulation: '⚖️ 政策监管动态',
        fundingMergers: '💰 大额融资与并购',
        developerUpdates: '👨‍💻 开发者功能更新'
      };
      
      const trendClass = categoryInfo.trend === '非常活跃' ? 'active' : 
                        categoryInfo.trend === '活跃' ? 'normal' : 'low';
      
      html += `
          <div class="category-section">
            <div class="category-title">
              ${categoryNames[category]} (${categoryInfo.count}条)
              <span class="trend-badge ${trendClass}">${categoryInfo.trend}</span>
            </div>
      `;
      
      categoryInfo.items.forEach(item => {
        html += `
            <div class="category-item">
              <a href="${item.link}" target="_blank">${item.title}</a>
              <div class="category-meta">📰 ${item.source}</div>
            </div>
        `;
      });
      
      html += `
          </div>
      `;
    });
    
    html += `
        </div>
    `;

    // 3. 今日关键影响总结
    html += `
        <div class="section">
          <h2 class="section-title">🎯 今日关键影响总结</h2>
          <div class="impact-list">
    `;
    
    summary.keyImpacts.forEach((impact, index) => {
      html += `
          <div class="impact-item">
            <strong>${index + 1}.</strong> ${impact}
          </div>
      `;
    });
    
    html += `
          </div>
        </div>
    `;

    html += `
        </div>
        
        <div class="footer">
          <p>📧 本邮件由AI新闻系统自动生成，每日早上8点推送</p>
          <p>🔗 如需了解更多详情，请点击新闻链接查看原文</p>
          <p>⚠️ 本内容仅供信息参考，不构成投资建议</p>
        </div>
      </body>
      </html>
    `;

    return html;
  }

  generateNewsSummary(news) {
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
      link: item.link,
      summary: this.extractKeyInfo(item.title),
      source: item.source,
      importance: item.importance
    }));

    // 按主题分析
    Object.keys(categories).forEach(category => {
      if (categories[category].length > 0) {
        summary.analysis[category] = {
          count: categories[category].length,
          items: categories[category].slice(0, 3),
          trend: this.analyzeTrend(categories[category])
        };
      }
    });

    // 总结关键影响（3-5条）
    summary.keyImpacts = this.identifyKeyImpacts(news);

    return summary;
  }

  categorizeNews(news) {
    const categories = {
      techGiants: [],
      modelProgress: [],
      policyRegulation: [],
      fundingMergers: [],
      developerUpdates: []
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

  extractKeyInfo(title) {
    if (title.length > 60) {
      return title.substring(0, 57) + '...';
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
    
    if (topNews.some(item => item.title.toLowerCase().includes('发布'))) {
      impacts.push('新产品发布可能改变市场格局，推动技术标准更新');
    }
    
    if (topNews.some(item => item.title.toLowerCase().includes('融资'))) {
      impacts.push('大额融资显示资本市场对AI的持续关注和信心');
    }
    
    if (topNews.some(item => item.title.toLowerCase().includes('监管'))) {
      impacts.push('政策监管变化将影响行业发展方向和合规要求');
    }
    
    if (topNews.some(item => item.title.toLowerCase().includes('模型'))) {
      impacts.push('模型技术进步推动应用场景扩展和性能提升');
    }
    
    if (topNews.some(item => item.title.toLowerCase().includes('收购'))) {
      impacts.push('行业并购活动加速，市场集中度进一步提升');
    }
    
    if (impacts.length === 0) {
      impacts.push('今日新闻整体显示行业稳步发展，技术持续进步');
    }
    
    return impacts.slice(0, 4);
  }

  async sendNewsEmail(news, techNews) {
    const recipient = process.env.RECIPIENT_EMAIL || '1372943709@qq.com';
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipient,
      subject: `🤖 AI科技新闻日报 - ${new Date().toLocaleDateString('zh-CN')}`,
      html: this.formatNewsHTML(news, techNews)
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('邮件发送成功:', result.messageId);
      return true;
    } catch (error) {
      console.error('邮件发送失败:', error);
      return false;
    }
  }
}

export default EmailService;