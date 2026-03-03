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

// 创建拼车请求
router.post('/', authenticateToken, async (req, res) => {
  const { station_id, departure_time, max_passengers, note } = req.body;

  // 输入验证
  if (!station_id || !departure_time) {
    return res.status(400).json({
      error: '车站和出发时间不能为空'
    });
  }

  if (max_passengers && (max_passengers < 1 || max_passengers > 8)) {
    return res.status(400).json({
      error: '乘客人数应在1-8之间'
    });
  }

  const departureDate = new Date(departure_time);
  const now = new Date();

  if (departureDate <= now) {
    return res.status(400).json({
      error: '出发时间应晚于当前时间'
    });
  }

  const db = getDB();

  try {
    // 验证车站是否存在
    const station = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM stations WHERE id = ? AND is_active = TRUE', [station_id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!station) {
      db.close();
      return res.status(404).json({
        error: '车站不存在或已停用'
      });
    }

    // 检查用户是否已有相同时间的拼车请求
    const existingRequest = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM ride_requests WHERE user_id = ? AND departure_time = ? AND status = "active"',
        [req.user.userId, departure_time],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingRequest) {
      db.close();
      return res.status(409).json({
        error: '您已发布相同时间的拼车请求'
      });
    }

    // 创建拼车请求
    const result = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO ride_requests (user_id, station_id, departure_time, max_passengers, note) 
         VALUES (?, ?, ?, ?, ?)`,
        [req.user.userId, station_id, departure_time, max_passengers || 4, note || null],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID });
        }
      );
    });

    // 获取完整的拼车请求信息
    const rideRequest = await new Promise((resolve, reject) => {
      db.get(
        `SELECT rr.*, s.name as station_name, s.location as station_location, u.name as user_name
         FROM ride_requests rr
         JOIN stations s ON rr.station_id = s.id
         JOIN users u ON rr.user_id = u.id
         WHERE rr.id = ?`,
        [result.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    db.close();

    res.status(201).json({
      message: '拼车请求创建成功',
      ride_request: rideRequest
    });

  } catch (error) {
    db.close();
    console.error('创建拼车请求错误:', error);
    res.status(500).json({
      error: '创建拼车请求失败'
    });
  }
});

// 获取拼车请求列表
router.get('/', async (req, res) => {
  const { station_id, status, limit = 20, offset = 0 } = req.query;
  const db = getDB();

  try {
    let query = `
      SELECT rr.*, s.name as station_name, s.location as station_location, 
             u.name as user_name, u.major as user_major
      FROM ride_requests rr
      JOIN stations s ON rr.station_id = s.id
      JOIN users u ON rr.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (station_id) {
      query += ' AND rr.station_id = ?';
      params.push(station_id);
    }

    if (status) {
      query += ' AND rr.status = ?';
      params.push(status);
    } else {
      query += ' AND rr.status = "active"';
    }

    // 只显示未来1小时内的请求
    query += ' AND rr.departure_time > datetime("now", "-1 hour")';

    query += ' ORDER BY rr.departure_time ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const rideRequests = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    db.close();
    res.json({
      ride_requests: rideRequests,
      total: rideRequests.length
    });

  } catch (error) {
    db.close();
    console.error('获取拼车请求错误:', error);
    res.status(500).json({
      error: '获取拼车请求失败'
    });
  }
});

// 获取用户的拼车请求
router.get('/my', authenticateToken, async (req, res) => {
  const { status, limit = 10, offset = 0 } = req.query;
  const db = getDB();

  try {
    let query = `
      SELECT rr.*, s.name as station_name, s.location as station_location
      FROM ride_requests rr
      JOIN stations s ON rr.station_id = s.id
      WHERE rr.user_id = ?
    `;
    const params = [req.user.userId];

    if (status) {
      query += ' AND rr.status = ?';
      params.push(status);
    }

    query += ' ORDER BY rr.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const rideRequests = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    db.close();
    res.json({
      ride_requests: rideRequests
    });

  } catch (error) {
    db.close();
    console.error('获取用户拼车请求错误:', error);
    res.status(500).json({
      error: '获取用户拼车请求失败'
    });
  }
});

// 加入拼车
router.post('/:id/join', authenticateToken, async (req, res) => {
  const rideRequestId = req.params.id;
  const db = getDB();

  try {
    // 获取拼车请求信息
    const rideRequest = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM ride_requests WHERE id = ? AND status = "active"',
        [rideRequestId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!rideRequest) {
      db.close();
      return res.status(404).json({
        error: '拼车请求不存在或已关闭'
      });
    }

    if (rideRequest.user_id === req.user.userId) {
      db.close();
      return res.status(400).json({
        error: '不能加入自己发布的拼车'
      });
    }

    if (rideRequest.current_passengers >= rideRequest.max_passengers) {
      db.close();
      return res.status(400).json({
        error: '拼车已满员'
      });
    }

    // 检查是否已经加入
    const alreadyJoined = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM ride_passengers WHERE ride_request_id = ? AND user_id = ?',
        [rideRequestId, req.user.userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (alreadyJoined) {
      db.close();
      return res.status(400).json({
        error: '您已经加入了这个拼车'
      });
    }

    // 加入拼车
    await new Promise((resolve, reject) => {
      db.run('INSERT INTO ride_passengers (ride_request_id, user_id) VALUES (?, ?)',
        [rideRequestId, req.user.userId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // 更新乘客数量
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE ride_requests SET current_passengers = current_passengers + 1 WHERE id = ?',
        [rideRequestId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // 检查是否满员，如果满员则更新状态
    const updatedRequest = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM ride_requests WHERE id = ?', [rideRequestId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (updatedRequest.current_passengers >= updatedRequest.max_passengers) {
      await new Promise((resolve, reject) => {
        db.run('UPDATE ride_requests SET status = "full" WHERE id = ?', [rideRequestId], (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    db.close();

    // 发送实时通知
    const io = req.app.get('io');
    io.emit('ride_updated', {
      ride_request_id: rideRequestId,
      action: 'passenger_joined',
      passenger_count: updatedRequest.current_passengers
    });

    res.json({
      message: '成功加入拼车',
      ride_request_id: rideRequestId
    });

  } catch (error) {
    db.close();
    console.error('加入拼车错误:', error);
    res.status(500).json({
      error: '加入拼车失败'
    });
  }
});

// 取消拼车请求
router.delete('/:id', authenticateToken, async (req, res) => {
  const rideRequestId = req.params.id;
  const db = getDB();

  try {
    // 验证拼车请求是否属于当前用户
    const rideRequest = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM ride_requests WHERE id = ? AND user_id = ?',
        [rideRequestId, req.user.userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!rideRequest) {
      db.close();
      return res.status(404).json({
        error: '拼车请求不存在或无权限'
      });
    }

    if (rideRequest.status !== 'active') {
      db.close();
      return res.status(400).json({
        error: '只能取消活跃状态的拼车请求'
      });
    }

    // 更新状态为已取消
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE ride_requests SET status = "cancelled", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [rideRequestId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    db.close();

    // 发送实时通知
    const io = req.app.get('io');
    io.emit('ride_updated', {
      ride_request_id: rideRequestId,
      action: 'cancelled'
    });

    res.json({
      message: '拼车请求已取消'
    });

  } catch (error) {
    db.close();
    console.error('取消拼车请求错误:', error);
    res.status(500).json({
      error: '取消拼车请求失败'
    });
  }
});

// 获取车站列表
router.get('/stations', async (req, res) => {
  const db = getDB();

  try {
    const stations = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM stations WHERE is_active = TRUE ORDER BY name',
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    db.close();
    res.json({ stations });

  } catch (error) {
    db.close();
    console.error('获取车站列表错误:', error);
    res.status(500).json({
      error: '获取车站列表失败'
    });
  }
});

module.exports = router;