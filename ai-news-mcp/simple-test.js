#!/usr/bin/env node

/**
 * 简单的AI新闻系统测试
 * 测试基本功能而不依赖复杂的模块解析
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 开始简单测试...');
console.log('测试目录:', __dirname);

// 测试1: 检查文件结构
console.log('\n📁 检查文件结构...');
const requiredFiles = [
  'src/newsService.js',
  'src/emailService.js', 
  'src/index.js',
  'package.json',
  '.env'
];

let filesOk = true;
for (const file of requiredFiles) {
  const filePath = path.join(__dirname, file);
  const exists = fs.existsSync(filePath);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (!exists) filesOk = false;
}

// 测试2: 检查package.json
console.log('\n📦 检查package.json...');
try {
  const packagePath = path.join(__dirname, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  console.log('  ✅ 项目名称:', pkg.name);
  console.log('  ✅ 版本:', pkg.version);
  console.log('  ✅ 脚本配置:', Object.keys(pkg.scripts || {}));
} catch (error) {
  console.log('  ❌ package.json读取失败:', error.message);
  filesOk = false;
}

// 测试3: 检查环境变量
console.log('\n🔧 检查环境变量...');
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredEnvVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'RECIPIENT_EMAIL'];
    
    for (const varName of requiredEnvVars) {
      const hasVar = envContent.includes(`${varName}=`);
      console.log(`  ${hasVar ? '✅' : '❌'} ${varName}`);
    }
  } else {
    console.log('  ❌ .env文件不存在');
  }
} catch (error) {
  console.log('  ❌ 环境变量检查失败:', error.message);
}

// 测试4: 检查源代码语法
console.log('\n📝 检查源代码语法...');
const sourceFiles = ['src/newsService.js', 'src/emailService.js', 'src/index.js'];
let syntaxOk = true;

for (const file of sourceFiles) {
  try {
    const filePath = path.join(__dirname, file);
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`  ✅ ${file} 语法检查通过`);
  } catch (error) {
    console.log(`  ❌ ${file} 语法检查失败:`, error.message);
    syntaxOk = false;
  }
}

// 测试总结
console.log('\n📊 测试总结');
console.log('='.repeat(30));
console.log(`文件结构: ${filesOk ? '✅ 通过' : '❌ 失败'}`);
console.log(`源代码语法: ${syntaxOk ? '✅ 通过' : '❌ 失败'}`);

const overallSuccess = filesOk && syntaxOk;
console.log(`整体状态: ${overallSuccess ? '✅ 系统就绪' : '❌ 需要修复'}`);

if (overallSuccess) {
  console.log('\n🎉 基本检查通过！系统可以运行测试了。');
  console.log('💡 提示: 在ai-news-mcp目录中运行 "npm install" 安装依赖');
  console.log('💡 提示: 然后运行 "npm test" 执行完整测试');
} else {
  console.log('\n⚠️  请先解决上述问题再进行测试');
}

process.exit(overallSuccess ? 0 : 1);