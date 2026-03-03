import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import NewsService from './newsService.js';
import EmailService from './emailService.js';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

const server = new Server(
  {
    name: 'ai-news-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const newsService = new NewsService();
const emailService = new EmailService();

// 工具列表
const tools = {
  get_latest_ai_news: {
    description: '获取最新的AI新闻',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: '返回新闻数量限制',
          default: 10
        }
      }
    }
  },
  get_tech_news: {
    description: '获取科技新闻',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: '返回新闻数量限制',
          default: 5
        }
      }
    }
  },
  send_news_email: {
    description: '发送新闻邮件到指定邮箱',
    inputSchema: {
      type: 'object',
      properties: {
        recipient: {
          type: 'string',
          description: '接收邮箱地址',
          default: process.env.RECIPIENT_EMAIL || '1372943709@qq.com'
        }
      }
    }
  },
  schedule_news_email: {
    description: '设置定时发送新闻邮件',
    inputSchema: {
      type: 'object',
      properties: {
        schedule: {
          type: 'string',
          description: 'Cron表达式，如 "0 8 * * *" 表示每天早上8点',
          default: process.env.CRON_SCHEDULE || '0 8 * * *'
        }
      }
    }
  }
};

// 注册工具处理器
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.entries(tools).map(([name, tool]) => ({
      name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case 'get_latest_ai_news': {
        const news = await newsService.fetchLatestNews();
        const limit = args?.limit || 10;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(news.slice(0, limit), null, 2)
            }
          ]
        };
      }
      
      case 'get_tech_news': {
        const techNews = await newsService.fetchTechNews();
        const limit = args?.limit || 5;
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(techNews.slice(0, limit), null, 2)
            }
          ]
        };
      }
      
      case 'send_news_email': {
        const recipient = args?.recipient || process.env.RECIPIENT_EMAIL;
        
        // 获取新闻
        const news = await newsService.fetchLatestNews();
        
        if (news.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: '过去24小时内没有找到相关新闻，跳过邮件发送'
              }
            ]
          };
        }
        
        // 发送邮件
        const success = await emailService.sendNewsEmail(news, []);
        
        return {
          content: [
            {
              type: 'text',
              text: success 
                ? `邮件已发送到 ${recipient}，包含${news.length}条新闻`
                : '邮件发送失败，请检查邮箱配置'
            }
          ]
        };
      }
      
      case 'schedule_news_email': {
        const schedule = args?.schedule || process.env.CRON_SCHEDULE || '0 8 * * *';
        
        // 停止之前的定时任务
        if (global.newsCronJob) {
          global.newsCronJob.stop();
        }
        
        // 创建新的定时任务
        global.newsCronJob = cron.schedule(schedule, async () => {
          console.log('🤖 正在发送定时新闻邮件...');
          const news = await newsService.fetchLatestNews();
          
          if (news.length === 0) {
            console.log('⚠️ 过去24小时内没有找到相关新闻，跳过邮件发送');
            return;
          }
          
          console.log(`📊 找到${news.length}条新闻，正在生成摘要和发送邮件...`);
          const success = await emailService.sendNewsEmail(news, []);
          
          if (success) {
            console.log('✅ 定时邮件发送成功');
          } else {
            console.log('❌ 定时邮件发送失败');
          }
        }, {
          scheduled: true,
          timezone: "Asia/Shanghai"
        });
        
        return {
          content: [
            {
              type: 'text',
              text: `已设置定时任务: ${schedule} (北京时间)，将发送AI与大模型行业日报`
            }
          ]
        };
      }
      
      default:
        return {
          content: [
            {
              type: 'text',
              text: `未知工具: ${name}`
            }
          ]
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `执行失败: ${error.message}`
        }
      ]
    };
  }
});

// 启动服务器
async function startServer() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log('AI新闻MCP服务器已启动');
    
    // 如果配置了定时任务，启动时自动设置
    if (process.env.CRON_SCHEDULE) {
      const schedule = process.env.CRON_SCHEDULE;
      global.newsCronJob = cron.schedule(schedule, async () => {
        console.log('🤖 正在发送定时新闻邮件...');
        const news = await newsService.fetchLatestNews();
        
        if (news.length === 0) {
          console.log('⚠️ 过去24小时内没有找到相关新闻，跳过邮件发送');
          return;
        }
        
        console.log(`📊 找到${news.length}条新闻，正在生成摘要和发送邮件...`);
        const success = await emailService.sendNewsEmail(news, []);
        
        if (success) {
          console.log('✅ 定时邮件发送成功');
        } else {
          console.log('❌ 定时邮件发送失败');
        }
      }, {
        scheduled: true,
        timezone: "Asia/Shanghai"
      });
      console.log(`🕐 已设置定时任务: ${schedule} (北京时间)`);
    }
    
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();