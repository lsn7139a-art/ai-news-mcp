#!/usr/bin/env node

/**
 * 校园拼车平台系统测试脚本
 * 验证核心功能和API接口
 */

const http = require('http');
const { URL } = require('url');

const BASE_URL = 'http://localhost:3001/api';

// 测试配置
const TEST_CONFIG = {
    timeout: 5000,
    retryCount: 3,
    retryDelay: 1000
};

// 测试用户数据
const TEST_USERS = [
    {
        student_id: '202301',
        password: '123456',
        name: '张三',
        major: '计算机科学',
        personality: 4,
        phone: '13800138001'
    },
    {
        student_id: '202302',
        password: '123456',
        name: '李四',
        major: '计算机科学',
        personality: 3,
        phone: '13800138002'
    },
    {
        student_id: '202303',
        password: '123456',
        name: '王五',
        major: '电子信息',
        personality: 5,
        phone: '13800138003'
    }
];

// HTTP请求工具
function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Campus-Ride-Test/1.0'
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({ status: res.statusCode, data: response });
                } catch (error) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(TEST_CONFIG.timeout, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// 延迟函数
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 测试套件
class TestSuite {
    constructor() {
        this.results = [];
        this.tokens = [];
    }

    async runTest(name, testFunc) {
        console.log(`\n🧪 测试: ${name}`);
        
        for (let attempt = 1; attempt <= TEST_CONFIG.retryCount; attempt++) {
            try {
                const result = await testFunc();
                console.log(`✅ 通过 (尝试 ${attempt})`);
                this.results.push({ name, status: 'PASS', result });
                return result;
            } catch (error) {
                console.log(`❌ 失败 (尝试 ${attempt}): ${error.message}`);
                if (attempt === TEST_CONFIG.retryCount) {
                    this.results.push({ name, status: 'FAIL', error: error.message });
                    throw error;
                }
                await delay(TEST_CONFIG.retryDelay);
            }
        }
    }

    async checkServerHealth() {
        return this.runTest('服务器健康检查', async () => {
            const response = await makeRequest('GET', '/rides');
            if (response.status !== 200) {
                throw new Error(`服务器响应异常: ${response.status}`);
            }
            return response.data;
        });
    }

    async testUserRegistration() {
        for (const user of TEST_USERS) {
            await this.runTest(`用户注册 - ${user.name}`, async () => {
                const response = await makeRequest('POST', '/auth/register', user);
                if (response.status !== 201) {
                    throw new Error(`注册失败: ${response.data.message || response.status}`);
                }
                return response.data;
            });
        }
    }

    async testUserLogin() {
        for (const user of TEST_USERS) {
            await this.runTest(`用户登录 - ${user.name}`, async () => {
                const response = await makeRequest('POST', '/auth/login', {
                    student_id: user.student_id,
                    password: user.password
                });
                if (response.status !== 200) {
                    throw new Error(`登录失败: ${response.data.message || response.status}`);
                }
                this.tokens.push(response.data.token);
                return response.data;
            });
        }
    }

    async testRideCreation() {
        const testRide = {
            departure_location: '学校正门',
            destination: '火车站',
            departure_time: '14:30',
            seats_available: 3,
            notes: '测试拼车信息'
        };

        return this.runTest('创建拼车', async () => {
            const response = await makeRequest('POST', '/rides', testRide, this.tokens[0]);
            if (response.status !== 201) {
                throw new Error(`创建拼车失败: ${response.data.message || response.status}`);
            }
            return response.data;
        });
    }

    async testMatchingAlgorithm() {
        return this.runTest('匹配算法测试', async () => {
            const response = await makeRequest('GET', '/matches/find', null, this.tokens[1]);
            if (response.status !== 200) {
                throw new Error(`匹配失败: ${response.data.message || response.status}`);
            }
            
            const matches = response.data.matches;
            if (!Array.isArray(matches) || matches.length === 0) {
                throw new Error('匹配结果为空或格式错误');
            }

            // 验证匹配算法逻辑
            const topMatch = matches[0];
            if (!topMatch.score || !topMatch.breakdown) {
                throw new Error('匹配结果缺少评分信息');
            }

            console.log(`   📊 最佳匹配评分: ${topMatch.score}/25`);
            console.log(`   📋 评分详情: ${topMatch.breakdown}`);
            
            return response.data;
        });
    }

    async testRideJoining() {
        return this.runTest('加入拼车', async () => {
            // 先获取可加入的拼车
            const ridesResponse = await makeRequest('GET', '/rides', null, this.tokens[1]);
            if (ridesResponse.status !== 200 || ridesResponse.data.length === 0) {
                throw new Error('没有可加入的拼车');
            }

            const rideId = ridesResponse.data[0].id;
            const joinResponse = await makeRequest('POST', `/rides/${rideId}/join`, {}, this.tokens[1]);
            
            if (joinResponse.status !== 200) {
                throw new Error(`加入拼车失败: ${joinResponse.data.message || joinResponse.status}`);
            }

            return joinResponse.data;
        });
    }

    async testRealTimeFeatures() {
        return this.runTest('实时功能测试', async () => {
            // 这里简单测试WebSocket连接
            // 实际项目中需要更复杂的WebSocket测试
            console.log('   📡 WebSocket连接测试需要客户端环境');
            return { status: 'WebSocket测试跳过（需要客户端环境）' };
        });
    }

    async runAllTests() {
        console.log('🚗 开始校园拼车平台系统测试');
        console.log('=' .repeat(50));

        try {
            await this.checkServerHealth();
            await this.testUserRegistration();
            await this.testUserLogin();
            await this.testRideCreation();
            await this.testMatchingAlgorithm();
            await this.testRideJoining();
            await this.testRealTimeFeatures();

            console.log('\n' + '=' .repeat(50));
            console.log('✅ 所有测试通过！');
            this.printResults();

        } catch (error) {
            console.log('\n' + '=' .repeat(50));
            console.log('❌ 测试过程中出现错误');
            console.log(`错误详情: ${error.message}`);
            this.printResults();
            process.exit(1);
        }
    }

    printResults() {
        console.log('\n📊 测试结果汇总:');
        console.log('-'.repeat(50));
        
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        const total = this.results.length;

        console.log(`总计: ${total} | 通过: ${passed} | 失败: ${failed}`);
        console.log(`成功率: ${((passed / total) * 100).toFixed(1)}%`);

        if (failed > 0) {
            console.log('\n❌ 失败的测试:');
            this.results
                .filter(r => r.status === 'FAIL')
                .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
        }

        console.log('\n🔗 测试完成！如果所有测试通过，系统运行正常。');
    }
}

// 主函数
async function main() {
    const testSuite = new TestSuite();
    
    console.log('📝 检查系统要求...');
    console.log('   - 服务器地址: http://localhost:3001');
    console.log('   - 前端地址: http://localhost:3000');
    console.log('   - 请确保系统已启动（运行 start.sh 或 start.bat）');
    
    await delay(2000); // 等待用户确认
    
    try {
        await testSuite.runAllTests();
    } catch (error) {
        console.error('测试执行失败:', error.message);
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { TestSuite, makeRequest };