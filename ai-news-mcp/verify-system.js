#!/usr/bin/env node

/**
 * AI新闻系统最终验证脚本
 * 验证系统是否完全准备好运行
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎯 AI新闻系统最终验证');
console.log('='.repeat(40));

// 验证步骤
const verificationSteps = [
  {
    name: '项目结构',
    check: () => {
      const requiredFiles = [
        'src/newsService.js',
        'src/emailService.js',
        'src/index.js',
        'package.json',
        '.env',
        'README.md',
        'DEPLOYMENT.md'
      ];
      return requiredFiles.every(file => 
        fs.existsSync(path.join(__dirname, file))
      );
    }
  },
  {
    name: '依赖配置',
    check: () => {
      const pkgPath = path.join(__dirname, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const requiredDeps = ['axios', 'cheerio', 'node-cron', 'nodemailer', 'dotenv'];
      const deps = Object.keys(pkg.dependencies || {});
      return requiredDeps.every(dep => deps.includes(dep));
    }
  },
  {
    name: '环境变量',
    check: () => {
      const envPath = path.join(__dirname, '.env');
      if (!fs.existsSync(envPath)) return false;
      
      const envContent = fs.readFileSync(envPath, 'utf8');
      const requiredVars = [
        'EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 
        'EMAIL_PASS', 'RECIPIENT_EMAIL', 'NEWS_API_KEY'
      ];
      return requiredVars.every(varName => 
        envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=your_`)
      );
    }
  },
  {
    name: '脚本配置',
    check: () => {
      const pkgPath = path.join(__dirname, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const scripts = pkg.scripts || {};
      return ['start', 'dev', 'test'].every(script => scripts[script]);
    }
  },
  {
    name: '代码质量',
    check: () => {
      const sourceFiles = ['src/newsService.js', 'src/emailService.js', 'src/index.js'];
      return sourceFiles.every(file => {
        const filePath = path.join(__dirname, file);
        if (!fs.existsSync(filePath)) return false;
        
        const content = fs.readFileSync(filePath, 'utf8');
        // 基本代码质量检查 - 修复验证逻辑
        const hasClass = content.includes('class ');
        const hasExport = content.includes('export') || content.includes('module.exports');
        const hasContent = content.length > 500;
        
        console.log(`    检查 ${file}: class=${hasClass}, export=${hasExport}, content=${hasContent}`);
        
        // index.js是主入口文件，不需要class和export
        if (file === 'src/index.js') {
          return hasContent;
        }
        
        return hasClass && hasExport && hasContent;
      });
    }
  }
];

// 执行验证
let allPassed = true;
const results = [];

for (const step of verificationSteps) {
  try {
    const passed = step.check();
    results.push({ name: step.name, passed });
    console.log(`${passed ? '✅' : '❌'} ${step.name}`);
    if (!passed) allPassed = false;
  } catch (error) {
    console.log(`❌ ${step.name} (检查失败: ${error.message})`);
    results.push({ name: step.name, passed: false, error: error.message });
    allPassed = false;
  }
}

// 显示结果
console.log('\n📊 验证结果');
console.log('='.repeat(40));
console.log(`总检查项: ${verificationSteps.length}`);
console.log(`通过项目: ${results.filter(r => r.passed).length}`);
console.log(`失败项目: ${results.filter(r => !r.passed).length}`);
console.log(`状态: ${allPassed ? '✅ 系统就绪' : '❌ 需要修复'}`);

// 提供下一步指导
if (allPassed) {
  console.log('\n🎉 恭喜！AI新闻系统已完全准备就绪');
  console.log('\n📋 下一步操作:');
  console.log('1. 在ai-news-mcp目录运行: npm install');
  console.log('2. 测试系统: npm test');
  console.log('3. 启动服务: npm start');
  console.log('4. 查看日志监控运行状态');
  
  console.log('\n⚡ 快速启动命令:');
  console.log('cd ai-news-mcp && npm install && npm test');
  
} else {
  console.log('\n⚠️  请先完成以下步骤:');
  results.filter(r => !r.passed).forEach(result => {
    console.log(`- 修复 ${result.name}: ${result.error || '配置问题'}`);
  });
}

process.exit(allPassed ? 0 : 1);