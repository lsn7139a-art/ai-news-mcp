#!/usr/bin/env node

/**
 * AI新闻系统测试脚本
 * 用于验证新闻收集、分类和邮件发送功能
 */

import NewsService from './src/newsService.js';
import EmailService from './src/emailService.js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

class SystemTester {
  constructor() {
    this.newsService = new NewsService();
    this.emailService = new EmailService();
    this.testResults = [];
  }

  // 记录测试结果
  logTest(testName, success, message = '', data = null) {
    const result = {
      test: testName,
      success,
      message,
      timestamp: new Date().toISOString(),
      data
    };
    this.testResults.push(result);
    
    const status = success ? '✅' : '❌';
    console.log(`${status} ${testName}: ${message}`);
    
    if (data && process.env.DEBUG) {
      console.log('   数据详情:', JSON.stringify(data, null, 2));
    }
  }

  // 测试新闻收集功能
  async testNewsCollection() {
    console.log('\n🔍 测试新闻收集功能...');
    
    try {
      const news = await this.newsService.fetchLatestNews();
      
      if (Array.isArray(news) && news.length > 0) {
        this.logTest('新闻收集', true, `成功收集${news.length}条新闻`, {
          count: news.length,
          sources: [...new Set(news.map(n => n.source))]
        });
        
        // 检查新闻质量
        const validNews = news.filter(n => n.title && n.summary);
        const quality = (validNews.length / news.length * 100).toFixed(1);
        this.logTest('新闻质量', true, `${quality}%的新闻包含完整信息`);
        
        return news;
      } else {
        this.logTest('新闻收集', false, '未收集到新闻或数据格式错误');
        return [];
      }
    } catch (error) {
      this.logTest('新闻收集', false, `收集失败: ${error.message}`);
      return [];
    }
  }

  // 测试新闻分类功能
  async testNewsCategorization(news) {
    console.log('\n📊 测试新闻分类功能...');
    
    if (news.length === 0) {
      this.logTest('新闻分类', false, '没有新闻可供分类测试');
      return {};
    }

    try {
      const categorized = this.newsService.categorizeNews(news);
      
      // 检查分类结果
      const totalCategorized = Object.values(categorized).reduce((sum, items) => sum + items.length, 0);
      const categorizationRate = (totalCategorized / news.length * 100).toFixed(1);
      
      this.logTest('新闻分类', true, `${categorizationRate}的新闻被成功分类`, {
        categories: Object.keys(categorized),
        distribution: Object.fromEntries(
          Object.entries(categorized).map(([category, items]) => [category, items.length])
        )
      });
      
      return categorized;
    } catch (error) {
      this.logTest('新闻分类', false, `分类失败: ${error.message}`);
      return {};
    }
  }

  // 测试邮件服务配置
  async testEmailConfiguration() {
    console.log('\n📧 测试邮件服务配置...');
    
    const requiredEnvVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'RECIPIENT_EMAIL'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      this.logTest('邮件配置', false, `缺少环境变量: ${missingVars.join(', ')}`);
      return false;
    }

    try {
      // 测试邮件服务初始化
      const transporter = this.emailService.transporter;
      if (transporter) {
        this.logTest('邮件配置', true, '邮件服务初始化成功');
        return true;
      } else {
        this.logTest('邮件配置', false, '邮件服务初始化失败');
        return false;
      }
    } catch (error) {
      this.logTest('邮件配置', false, `配置测试失败: ${error.message}`);
      return false;
    }
  }

  // 测试邮件模板生成
  async testEmailTemplate(news, categorized) {
    console.log('\n📝 测试邮件模板生成...');
    
    if (news.length === 0) {
      this.logTest('邮件模板', false, '没有新闻可供生成模板');
      return null;
    }

    try {
      const html = this.emailService.generateEmailTemplate(news, categorized);
      
      // 检查模板内容
      const checks = [
        { test: '包含标题', pattern: /AI与大模型行业日报/ },
        { test: '包含新闻列表', pattern: /📈 今日重要新闻/ },
        { test: '包含分类分析', pattern: /🔍 主题分类分析/ },
        { test: '包含影响总结', pattern: /🎯 今日关键影响总结/ },
        { test: '包含样式', pattern: /<style>/ }
      ];
      
      const passedChecks = checks.filter(check => check.pattern.test(html));
      const templateQuality = (passedChecks.length / checks.length * 100).toFixed(1);
      
      this.logTest('邮件模板', true, `模板生成成功，质量评分${templateQuality}%`, {
        size: html.length,
        checks: passedChecks.map(c => c.test)
      });
      
      return html;
    } catch (error) {
      this.logTest('邮件模板', false, `模板生成失败: ${error.message}`);
      return null;
    }
  }

  // 测试摘要生成
  async testSummaryGeneration(news) {
    console.log('\n🎯 测试摘要生成功能...');
    
    if (news.length === 0) {
      this.logTest('摘要生成', false, '没有新闻可供生成摘要');
      return null;
    }

    try {
      const summary = this.emailService.generateSummary(news);
      
      // 检查摘要质量
      const hasStructure = summary.includes('🎯 今日关键影响总结');
      const hasPoints = summary.match(/•/g)?.length >= 3;
      const hasAnalysis = summary.length > 100;
      
      const qualityChecks = [
        hasStructure,
        hasPoints,
        hasAnalysis
      ].filter(Boolean).length;
      
      const quality = (qualityChecks / 3 * 100).toFixed(1);
      
      this.logTest('摘要生成', true, `摘要生成成功，质量评分${quality}%`, {
        length: summary.length,
        hasStructure,
        hasPoints,
        hasAnalysis
      });
      
      return summary;
    } catch (error) {
      this.logTest('摘要生成', false, `摘要生成失败: ${error.message}`);
      return null;
    }
  }

  // 测试完整邮件发送 (可选)
  async testEmailSending(news, categorized) {
    console.log('\n📤 测试邮件发送功能...');
    
    // 只有在明确配置测试邮箱时才发送
    if (!process.env.TEST_RECIPIENT_EMAIL) {
      this.logTest('邮件发送', false, '未配置测试邮箱，跳过发送测试');
      return false;
    }

    try {
      const success = await this.emailService.sendNewsEmail(
        news, 
        categorized, 
        process.env.TEST_RECIPIENT_EMAIL
      );
      
      if (success) {
        this.logTest('邮件发送', true, `测试邮件已发送到 ${process.env.TEST_RECIPIENT_EMAIL}`);
      } else {
        this.logTest('邮件发送', false, '邮件发送失败');
      }
      
      return success;
    } catch (error) {
      this.logTest('邮件发送', false, `发送失败: ${error.message}`);
      return false;
    }
  }

  // 生成测试报告
  generateReport() {
    console.log('\n📊 生成测试报告...');
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = (passedTests / totalTests * 100).toFixed(1);
    
    const report = {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate: `${successRate}%`,
        timestamp: new Date().toISOString()
      },
      details: this.testResults
    };
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 AI新闻系统测试报告');
    console.log('='.repeat(50));
    console.log(`总测试数: ${totalTests}`);
    console.log(`通过测试: ${passedTests}`);
    console.log(`失败测试: ${failedTests}`);
    console.log(`成功率: ${successRate}%`);
    console.log('='.repeat(50));
    
    // 显示失败的测试
    const failedTestsList = this.testResults.filter(r => !r.success);
    if (failedTestsList.length > 0) {
      console.log('\n❌ 失败的测试:');
      failedTestsList.forEach(test => {
        console.log(`   - ${test.test}: ${test.message}`);
      });
    }
    
    // 保存报告到文件
    const reportPath = `test-report-${new Date().toISOString().split('T')[0]}.json`;
    require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 详细报告已保存到: ${reportPath}`);
    
    return report;
  }

  // 运行完整测试套件
  async runFullTestSuite() {
    console.log('🚀 开始AI新闻系统完整测试...');
    console.log('测试时间:', new Date().toLocaleString('zh-CN'));
    
    try {
      // 1. 测试新闻收集
      const news = await this.testNewsCollection();
      
      // 2. 测试新闻分类
      const categorized = await this.testNewsCategorization(news);
      
      // 3. 测试邮件配置
      const emailConfigured = await this.testEmailConfiguration();
      
      // 4. 测试邮件模板
      const template = await this.testEmailTemplate(news, categorized);
      
      // 5. 测试摘要生成
      const summary = await this.testSummaryGeneration(news);
      
      // 6. 测试邮件发送 (可选)
      if (emailConfigured && news.length > 0) {
        await this.testEmailSending(news, categorized);
      }
      
      // 7. 生成报告
      return this.generateReport();
      
    } catch (error) {
      console.error('❌ 测试套件执行失败:', error.message);
      this.logTest('测试套件', false, `执行失败: ${error.message}`);
      return this.generateReport();
    }
  }
}

// 主函数
async function main() {
  const tester = new SystemTester();
  const report = await tester.runFullTestSuite();
  
  // 根据测试结果设置退出码
  const failedTests = report.summary.failedTests;
  process.exit(failedTests > 0 ? 1 : 0);
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default SystemTester;