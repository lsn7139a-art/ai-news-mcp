#!/usr/bin/env node

/**
 * 🚗 校园拼车平台 - 匹配算法演示
 * 展示三重匹配算法的核心逻辑
 */

console.log('🎯 校园拼车平台 - 匹配算法演示');
console.log('=' .repeat(50));

// 模拟用户数据
const users = [
    {
        student_id: "202301001",
        name: "张同学",
        major: "计算机科学",
        personality: 4, // 外向
        departure_time: "14:30",
        destination: "火车站",
        description: "去火车站赶火车"
    },
    {
        student_id: "202301002", 
        name: "李同学",
        major: "计算机科学",
        personality: 3, // 中等
        departure_time: "14:35",
        destination: "火车站",
        description: "也要去火车站"
    },
    {
        student_id: "202301003",
        name: "王同学", 
        major: "软件工程",
        personality: 5, // 很外向
        departure_time: "14:40",
        destination: "火车站",
        description: "一起拼车吧"
    },
    {
        student_id: "202301004",
        name: "陈同学",
        major: "计算机科学", 
        personality: 2, // 内向
        departure_time: "15:00",
        destination: "火车站",
        description: "15点出发"
    },
    {
        student_id: "202301005",
        name: "刘同学",
        major: "电子信息",
        personality: 4, // 外向
        departure_time: "14:25", 
        destination: "火车站",
        description: "早一点出发"
    }
];

/**
 * 计算匹配分数（核心算法）
 */
function calculateMatchScore(user1, user2) {
    // 1. 专业匹配（权重40%）
    const major_score = user1.major === user2.major ? 10 : 0;
    
    // 2. 性格匹配（权重30%）
    const personality_diff = Math.abs(user1.personality - user2.personality);
    const personality_score = personality_diff <= 1 ? 5 : Math.max(0, 5 - personality_diff);
    
    // 3. 时间匹配（权重30%）
    const time1 = new Date(`2000-01-01 ${user1.departure_time}`);
    const time2 = new Date(`2000-01-01 ${user2.departure_time}`);
    const time_diff_minutes = Math.abs(time1 - time2) / (1000 * 60);
    const time_score = Math.max(0, 10 - Math.floor(time_diff_minutes / 5) * 2);
    
    const total_score = major_score + personality_score + time_score;
    
    return {
        total_score,
        breakdown: `专业:${major_score}/10 | 性格:${personality_score}/5 | 时间:${time_score}/10`,
        is_match: total_score >= 20
    };
}

/**
 * 寻找最佳匹配
 */
function findBestMatches(currentUser, allUsers, maxMatches = 3) {
    const matches = [];
    
    for (const user of allUsers) {
        if (user.student_id === currentUser.student_id) continue;
        if (user.destination !== currentUser.destination) continue;
        
        const score = calculateMatchScore(currentUser, user);
        if (score.is_match) {
            matches.push({
                user,
                ...score
            });
        }
    }
    
    // 按分数排序
    matches.sort((a, b) => b.total_score - a.total_score);
    return matches.slice(0, maxMatches);
}

console.log('\n👥 用户列表:');
users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} (${user.student_id}) - ${user.major} - 性格${user.personality}/5 - ${user.departure_time}去${user.destination}`);
});

// 演示每个用户的匹配结果
console.log('\n🔍 匹配结果演示:');
console.log('-'.repeat(50));

for (let i = 0; i < Math.min(3, users.length); i++) {
    const currentUser = users[i];
    const matches = findBestMatches(currentUser, users);
    
    console.log(`\n🎯 ${currentUser.name} 的匹配结果:`);
    console.log(`   目的地: ${currentUser.destination}, 出发时间: ${currentUser.departure_time}`);
    
    if (matches.length === 0) {
        console.log('   ❌ 暂无匹配的拼车伙伴');
    } else {
        matches.forEach((match, index) => {
            console.log(`   ✅ 匹配${index + 1}: ${match.user.name} - 总分${match.total_score}/25`);
            console.log(`      ${match.breakdown} | ${match.user.departure_time}出发`);
        });
    }
}

// 详细展示一对用户的匹配计算过程
console.log('\n📊 详细匹配计算示例:');
console.log('-'.repeat(50));
const user1 = users[0];
const user2 = users[1];

console.log(`匹配 ${user1.name} 和 ${user2.name}:`);
console.log(`专业匹配: ${user1.major} vs ${user2.major} = ${user1.major === user2.major ? '✅ 10分' : '❌ 0分'}`);
console.log(`性格匹配: ${user1.personality} vs ${user2.personality} = 差值${Math.abs(user1.personality - user2.personality)} = ${Math.abs(user1.personality - user2.personality) <= 1 ? '✅ 5分' : `❌ ${Math.max(0, 5 - Math.abs(user1.personality - user2.personality))}分`}`);

const time1 = new Date(`2000-01-01 ${user1.departure_time}`);
const time2 = new Date(`2000-01-01 ${user2.departure_time}`);
const time_diff = Math.abs(time1 - time2) / (1000 * 60);
const time_score = Math.max(0, 10 - Math.floor(time_diff / 5) * 2);

console.log(`时间匹配: ${user1.departure_time} vs ${user2.departure_time} = 相差${time_diff}分钟 = ${time_score}分`);

const final_score = calculateMatchScore(user1, user2);
console.log(`\n🎯 最终得分: ${final_score.total_score}/25`);
console.log(`   ${final_score.breakdown}`);
console.log(`   匹配结果: ${final_score.is_match ? '✅ 推荐匹配' : '❌ 不推荐'}`);

console.log('\n🎉 演示完成！');
console.log('\n💡 算法特点:');
console.log('   - 专业相同得满分（10分）');
console.log('   - 性格相近得高分（最多5分）');
console.log('   - 时间相近得高分（最多10分）');
console.log('   - 总分≥20分才推荐匹配');
console.log('   - 确保高信任、高质量的拼车体验');