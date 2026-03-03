const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { authenticateToken } = require('./auth');
const MatchingAlgorithm = require('../services/matchingAlgorithm');

const router = express.Router();
const { dbPath } = require('../database/init');
const matchingAlgorithm = new MatchingAlgorithm();

// 获取数据库连接
const getDB = () => {
  return new sqlite3.Database(dbPath);
};

// 为用户寻找匹配
router.post('/find', authenticateToken, async (req, res) => {
  const { station_id, departure_time, max_results = 5 } = req.body;

  // 输入验证
  if (!station_id || !departure_time) {
    return res.status(400).json({
      error: '车站和出发时间不能为空'
    });
  }

  const db = getDB();

  try {
    // 获取当前用户信息
    const currentUser = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE id = ?',
        [req.user.userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!currentUser) {
      db.close();
      return res.status(404).json({
        error: '用户不存在'
      });
    }

    // 验证用户数据完整性
    if (!matchingAlgorithm.validateUserData(currentUser)) {
      db.close();
      return res.status(400).json({
        error: '用户数据不完整，无法进行匹配'
      });
    }

    // 设置用户的出发时间
    currentUser.departure_time = departure_time;

    // 查找同一车站的其他活跃拼车请求
    const timeWindow = 60; // 60分钟时间窗口
    const candidateRequests = await new Promise((resolve, reject) => {
      db.all(`
        SELECT DISTINCT rr.*, u.name, u.major, u.personality, u.phone, u.email
        FROM ride_requests rr
        JOIN users u ON rr.user_id = u.id
        WHERE rr.station_id = ? 
          AND rr.status = 'active'
          AND rr.user_id != ?
          AND ABS(julianday(rr.departure_time) - julianday(?)) * 24 * 60 <= ?
        ORDER BY ABS(julianday(rr.departure_time) - julianday(?)) * 24 * 60
        LIMIT 20
      `, [station_id, req.user.userId, departure_time, timeWindow, departure_time], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // 为每个候选用户设置出发时间
    const candidates = candidateRequests.map(request => ({
      ...request,
      departure_time: request.departure_time
    }));

    // 计算匹配分数
    const matches = matchingAlgorithm.findBestMatches(currentUser, candidates, departure_time);

    // 保存匹配记录到数据库
    if (matches.length > 0) {
      const insertMatch = db.prepare(`
        INSERT INTO matches (requester_id, matched_user_id, ride_request_id, match_score, breakdown, status)
        VALUES (?, ?, ?, ?, ?, 'pending')
      `);

      for (const match of matches.slice(0, max_results)) {
        await new Promise((resolve, reject) => {
          insertMatch.run([
            req.user.userId,
            match.user.id,
            match.user.ride_request_id || match.id,
            match.total_score,
            match.breakdown
          ], function(err) {
            if (err) reject(err);
            else resolve({ id: this.lastID });
          });
        });
      }
      insertMatch.finalize();
    }

    db.close();

    res.json({
      matches: matches.slice(0, max_results),
      total_candidates: candidates.length,
      search_criteria: {
        station_id,
        departure_time,
        time_window_minutes: timeWindow
      }
    });

  } catch (error) {
    db.close();
    console.error('寻找匹配错误:', error);
    res.status(500).json({
      error: '寻找匹配失败'
    });
  }
});

// 获取用户的匹配历史
router.get('/history', authenticateToken, async (req, res) => {
  const { status, limit = 10, offset = 0 } = req.query;
  const db = getDB();

  try {
    let query = `
      SELECT m.*, 
             u1.name as requester_name, u1.major as requester_major,
             u2.name as matched_user_name, u2.major as matched_user_major,
             rr.departure_time, rr.note,
             s.name as station_name, s.location as station_location
      FROM matches m
      JOIN users u1 ON m.requester_id = u1.id
      JOIN users u2 ON m.matched_user_id = u2.id
      JOIN ride_requests rr ON m.ride_request_id = rr.id
      JOIN stations s ON rr.station_id = s.id
      WHERE m.requester_id = ? OR m.matched_user_id = ?
    `;
    const params = [req.user.userId, req.user.userId];

    if (status) {
      query += ' AND m.status = ?';
      params.push(status);
    }

    query += ' ORDER BY m.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const matches = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    db.close();
    res.json({
      matches
    });

  } catch (error) {
    db.close();
    console.error('获取匹配历史错误:', error);
    res.status(500).json({
      error: '获取匹配历史失败'
    });
  }
});

// 更新匹配状态
router.put('/:id/status', authenticateToken, async (req, res) => {
  const matchId = req.params.id;
  const { status } = req.body;

  if (!status || !['pending', 'accepted', 'rejected', 'completed'].includes(status)) {
    return res.status(400).json({
      error: '无效的状态值',
      valid_statuses: ['pending', 'accepted', 'rejected', 'completed']
    });
  }

  const db = getDB();

  try {
    // 验证匹配是否属于当前用户
    const match = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM matches WHERE id = ? AND (requester_id = ? OR matched_user_id = ?)',
        [matchId, req.user.userId, req.user.userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!match) {
      db.close();
      return res.status(404).json({
        error: '匹配记录不存在或无权限'
      });
    }

    // 更新状态
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE matches SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, matchId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    db.close();

    // 发送实时通知
    const io = req.app.get('io');
    io.emit('match_updated', {
      match_id: matchId,
      status,
      user_id: req.user.userId
    });

    res.json({
      message: '匹配状态更新成功',
      match_id: matchId,
      status
    });

  } catch (error) {
    db.close();
    console.error('更新匹配状态错误:', error);
    res.status(500).json({
      error: '更新匹配状态失败'
    });
  }
});

// 批量匹配（系统自动匹配）
router.post('/batch', async (req, res) => {
  const db = getDB();

  try {
    // 获取所有活跃的拼车请求
    const rideRequests = await new Promise((resolve, reject) => {
      db.all(`
        SELECT rr.*, u.name, u.major, u.personality
        FROM ride_requests rr
        JOIN users u ON rr.user_id = u.id
        WHERE rr.status = 'active'
        AND rr.departure_time > datetime('now')
        ORDER BY rr.departure_time
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // 获取所有用户信息
    const allUsers = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // 执行批量匹配
    const batchResults = matchingAlgorithm.batchMatching(rideRequests, allUsers);

    // 保存匹配结果
    let savedMatches = 0;
    if (batchResults.length > 0) {
      const insertMatch = db.prepare(`
        INSERT OR IGNORE INTO matches (requester_id, matched_user_id, ride_request_id, match_score, breakdown, status)
        VALUES (?, ?, ?, ?, ?, 'pending')
      `);

      for (const result of batchResults) {
        for (const match of result.matches) {
          await new Promise((resolve, reject) => {
            insertMatch.run([
              result.requester.id,
              match.user.id,
              result.request_id,
              match.total_score,
              match.breakdown
            ], function(err) {
              if (err) reject(err);
              else savedMatches++;
            });
          });
        }
      }
      insertMatch.finalize();
    }

    db.close();

    res.json({
      message: '批量匹配完成',
      results: batchResults,
      saved_matches: savedMatches,
      processed_requests: rideRequests.length
    });

  } catch (error) {
    db.close();
    console.error('批量匹配错误:', error);
    res.status(500).json({
      error: '批量匹配失败'
    });
  }
});

// 获取匹配统计信息
router.get('/stats', authenticateToken, async (req, res) => {
  const db = getDB();

  try {
    // 用户的匹配统计
    const userStats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_matches,
          COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_matches,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_matches,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_matches,
          AVG(match_score) as avg_score,
          MAX(match_score) as max_score
        FROM matches 
        WHERE requester_id = ? OR matched_user_id = ?
      `, [req.user.userId, req.user.userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // 全局匹配统计
    const globalStats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_matches,
          COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_matches,
          COUNT(DISTINCT requester_id) as unique_requesters,
          COUNT(DISTINCT matched_user_id) as unique_matched_users,
          AVG(match_score) as avg_score
        FROM matches
      `, [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    db.close();

    res.json({
      user_stats: userStats,
      global_stats: globalStats
    });

  } catch (error) {
    db.close();
    console.error('获取匹配统计错误:', error);
    res.status(500).json({
      error: '获取匹配统计失败'
    });
  }
});

module.exports = router;