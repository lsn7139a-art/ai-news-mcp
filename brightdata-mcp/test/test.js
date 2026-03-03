#!/usr/bin/env node

import { testProxyConnection, getProxyConfig, getProxyZones } from '../src/brightdata.js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

console.log('🧪 BrightData MCP 测试开始...\n');

// 测试代理配置
async function testProxyConfig() {
  console.log('📋 检查代理配置...');
  const config = getProxyConfig();
  
  console.log('代理配置:');
  console.log(`  主机: ${config.host}`);
  console.log(`  端口: ${config.port}`);
  console.log(`  用户名: ${config.username || '未配置'}`);
  console.log(`  密码: ${config.password || '未配置'}`);
  console.log(`  配置状态: ${config.configured ? '✅ 已配置' : '❌ 未配置'}`);
  console.log();
  
  return config.configured;
}

// 测试代理连接
async function testConnection() {
  console.log('🌐 测试代理连接...');
  try {
    const result = await testProxyConnection();
    
    if (result.success) {
      console.log('✅ 代理连接成功!');
      console.log('响应数据:', JSON.stringify(result.data, null, 2));
    } else {
      console.log('❌ 代理连接失败:', result.error);
    }
  } catch (error) {
    console.log('❌ 连接测试异常:', error.message);
  }
  console.log();
}

// 测试代理区域
async function testZones() {
  console.log('🗺️ 测试代理区域信息...');
  try {
    const result = await getProxyZones();
    
    if (result.success) {
      console.log('✅ 代理区域信息获取成功:');
      result.zones.forEach(zone => {
        console.log(`  - ${zone.name}: ${zone.description} (${zone.type})`);
      });
    } else {
      console.log('❌ 代理区域信息获取失败:', result.error);
    }
  } catch (error) {
    console.log('❌ 区域测试异常:', error.message);
  }
  console.log();
}

// 主测试函数
async function runTests() {
  try {
    // 检查配置
    const configured = await testProxyConfig();
    
    if (!configured) {
      console.log('⚠️  警告: BrightData 凭据未配置');
      console.log('请在 .env 文件中设置 BRIGHTDATA_USERNAME 和 BRIGHTDATA_PASSWORD');
      console.log();
      return;
    }
    
    // 测试连接
    await testConnection();
    
    // 测试区域
    await testZones();
    
    console.log('🎉 测试完成!');
    
  } catch (error) {
    console.error('💥 测试过程中发生错误:', error);
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}