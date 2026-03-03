/**
 * 三重匹配算法实现
 * 基于专业相似度+性格兼容度+时间精准度的拼车匹配算法
 */

class MatchingAlgorithm {
  constructor() {
    // 专业列表（共12个专业）
    this.majors = [
      '计算机科学',
      '软件工程',
      '电子信息',
      '机械工程',
      '土木工程',
      '化学工程',
      '材料科学',
      '生物医学',
      '经济学',
      '管理学',
      '外国语言',
      '艺术设计'
    ];
  }

  /**
   * 计算两个用户之间的匹配分数
   * @param {Object} user1 - 用户1数据
   * @param {Object} user2 - 用户2数据
   * @param {Date} targetDepartureTime - 目标出发时间
   * @returns {Object} 匹配结果
   */
  calculateMatchScore(user1, user2, targetDepartureTime) {
    // 1. 专业匹配（权重40%，满分10分）
    const majorScore = this.calculateMajorScore(user1.major, user2.major);
    
    // 2. 性格匹配（权重30%，满分5分）
    const personalityScore = this.calculatePersonalityScore(user1.personality, user2.personality);
    
    // 3. 时间匹配（权重30%，满分10分）
    const timeScore = this.calculateTimeScore(user1.departure_time, user2.departure_time || targetDepartureTime);
    
    // 计算总分（满分25分）
    const totalScore = majorScore + personalityScore + timeScore;
    
    return {
      total_score: totalScore,
      breakdown: `专业:${majorScore}/10 | 性格:${personalityScore}/5 | 时间:${timeScore}/10`,
      major_score: majorScore,
      personality_score: personalityScore,
      time_score: timeScore,
      is_match: totalScore >= 20 // 仅≥20分才推荐
    };
  }

  /**
   * 计算专业匹配分数
   * @param {string} major1 - 用户1专业
   * @param {string} major2 - 用户2专业
   * @returns {number} 专业分数 (0-10)
   */
  calculateMajorScore(major1, major2) {
    return major1 === major2 ? 10 : 0;
  }

  /**
   * 计算性格匹配分数
   * @param {number} personality1 - 用户1性格值 (1-5)
   * @param {number} personality2 - 用户2性格值 (1-5)
   * @returns {number} 性格分数 (0-5)
   */
  calculatePersonalityScore(personality1, personality2) {
    const personalityDiff = Math.abs(personality1 - personality2);
    if (personalityDiff <= 1) {
      return 5;
    } else {
      return Math.max(0, 5 - personalityDiff);
    }
  }

  /**
   * 计算时间匹配分数
   * @param {Date|string} time1 - 时间1
   * @param {Date|string} time2 - 时间2
   * @returns {number} 时间分数 (0-10)
   */
  calculateTimeScore(time1, time2) {
    const date1 = new Date(time1);
    const date2 = new Date(time2);
    
    const timeDiffMinutes = Math.abs(date1 - date2) / (1000 * 60);
    
    // 每超5分钟-2分（≤30分钟得10分）
    if (timeDiffMinutes <= 30) {
      return 10;
    } else {
      const penalty = Math.floor(timeDiffMinutes / 5) * 2;
      return Math.max(0, 10 - penalty);
    }
  }

  /**
   * 为指定用户查找最佳匹配
   * @param {Object} requester - 发起请求的用户
   * @param {Array} candidates - 候选用户列表
   * @param {Date} targetDepartureTime - 目标出发时间
   * @returns {Array} 排序后的匹配列表
   */
  findBestMatches(requester, candidates, targetDepartureTime) {
    const matches = [];
    
    candidates.forEach(candidate => {
      if (candidate.id !== requester.id) {
        const matchResult = this.calculateMatchScore(requester, candidate, targetDepartureTime);
        if (matchResult.is_match) {
          matches.push({
            user: candidate,
            ...matchResult
          });
        }
      }
    });

    // 按匹配分数降序排序
    matches.sort((a, b) => b.total_score - a.total_score);
    
    return matches;
  }

  /**
   * 批量匹配算法 - 为多个请求寻找匹配
   * @param {Array} rideRequests - 拼车请求列表
   * @param {Array} allUsers - 所有用户列表
   * @returns {Array} 匹配结果列表
   */
  batchMatching(rideRequests, allUsers) {
    const results = [];
    
    rideRequests.forEach(request => {
      const requester = allUsers.find(u => u.id === request.user_id);
      if (!requester) return;
      
      // 查找同一车站、同一时间段的其他请求
      const timeWindow = 60; // 60分钟时间窗口
      const candidateRequests = rideRequests.filter(r => {
        if (r.id === request.id) return false;
        if (r.station_id !== request.station_id) return false;
        
        const timeDiff = Math.abs(new Date(r.departure_time) - new Date(request.departure_time)) / (1000 * 60);
        return timeDiff <= timeWindow;
      });
      
      // 获取候选用户
      const candidateUsers = candidateRequests.map(r => allUsers.find(u => u.id === r.user_id)).filter(Boolean);
      
      // 计算匹配分数
      const matches = this.findBestMatches(requester, candidateUsers, request.departure_time);
      
      if (matches.length > 0) {
        results.push({
          request_id: request.id,
          requester: requester,
          matches: matches.slice(0, 5), // 只保留前5个最佳匹配
          match_count: matches.length
        });
      }
    });
    
    return results;
  }

  /**
   * 验证用户数据完整性
   * @param {Object} user - 用户数据
   * @returns {boolean} 数据是否有效
   */
  validateUserData(user) {
    return (
      user &&
      user.major && this.majors.includes(user.major) &&
      user.personality && user.personality >= 1 && user.personality <= 5 &&
      user.departure_time
    );
  }
}

module.exports = MatchingAlgorithm;