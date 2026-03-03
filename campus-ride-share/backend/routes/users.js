const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { authenticateToken } = require('./auth');

const router = express.Router();
const { dbPath } = require('../database/init');

// 获取数据库连接
const getDB = () => {
  return new sqlite3.Database(dbPath);
};

// 更新用户资料
router.put('/profile', authenticateToken, async (req, res) => {
  const { name, major, personality, phone, email } = req.body;

  const db = getDB();

  try {
    // 构建更新字段
    const updates = [];
    const params = [];
    
    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (major) {
      updates.push('major = ?');
      params.push(major);
    }
    if (personality !== undefined) {
      if (personality < 1 || personality > 5) {
        db.close();
        return res.status(400).json({
          error: '性格值应在1-5之间'
        });
      }
      updates.push('personality = ?');
      params.push(personality);
    }
    if (phone) {
      updates.push('phone = ?');
      params.push(phone);
    }
    if (email) {
      updates.push('email = ?');
      params.push(email);
    }

    if (updates.length === 0) {
      db.close();
      return res.status(400).json({
        error: '没有要更新的字段'
      });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(req.user.userId);

    // 执行更新
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        params,
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });

    // 获取更新后的用户信息
    const updatedUser = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, student_id, name, major, personality, phone, email, is_verified, created_at FROM users WHERE id = ?',
        [req.user.userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    db.close();

    res.json({
      message: '用户资料更新成功',
      user: updatedUser
    });

  } catch (error) {
    db.close();
    console.error('更新用户资料错误:', error);
    res.status(500).json({
      error: '更新用户资料失败'
    });
  }
});

// 获取用户详情
router.get('/:id', authenticateToken, async (req, res) => {
  const userId = req.params.id;
  const db = getDB();

  try {
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, student_id, name, major, personality, is_verified, created_at FROM users WHERE id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      db.close();
      return res.status(404).json({
        error: '用户不存在'
      });
    }

    // 获取用户的拼车统计
    const rideStats = await new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_requests,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_requests,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_requests,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_requests
        FROM ride_requests 
        WHERE user_id = ?
      `, [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    db.close();

    res.json({
      user,
      ride_stats: rideStats
    });

  } catch (error) {
    db.close();
    console.error('获取用户详情错误:', error);
    res.status(500).json({
      error: '获取用户详情失败'
    });
  }
});

// 获取用户列表（搜索功能）
router.get('/', authenticateToken, async (req, res) => {
  const { search, major, personality, limit = 20, offset = 0 } = req.query;
  const db = getDB();

  try {
    let query = `
      SELECT id, student_id, name, major, personality, is_verified, created_at
      FROM users
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR student_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (major) {
      query += ' AND major = ?';
      params.push(major);
    }

    if (personality) {
      query += ' AND personality = ?';
      params.push(personality);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const users = await new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // 获取总数
    const countQuery = query.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) FROM').replace(/ORDER BY.*$/, '');
    const countParams = params.slice(0, -2);
    
    const totalCount = await new Promise((resolve, reject) => {
      db.get(countQuery, countParams, (err, row) => {
        if (err) reject(err);
        else resolve(row['COUNT(*)']);
      });
    });

    db.close();

    res.json({
      users,
      total: totalCount,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    db.close();
    console.error('获取用户列表错误:', error);
    res.status(500).json({
      error: '获取用户列表失败'
    });
  }
});

// 修改密码
router.put('/password', authenticateToken, async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({
      error: '当前密码和新密码不能为空'
    });
  }

  if (new_password.length < 6) {
    return res.status(400).json({
      error: '新密码长度至少6位'
    });
  }

  const db = getDB();
  const bcrypt = require('bcryptjs');

  try {
    // 获取当前用户信息
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [req.user.userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!user) {
      db.close();
      return res.status(404).json({
        error: '用户不存在'
      });
    }

    // 验证当前密码
    const isValidPassword = await bcrypt.compare(current_password, user.password);
    if (!isValidPassword) {
      db.close();
      return res.status(401).json({
        error: '当前密码错误'
      });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // 更新密码
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, req.user.userId],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });

    db.close();

    res.json({
      message: '密码修改成功'
    });

  } catch (error) {
    db.close();
    console.error('修改密码错误:', error);
    res.status(500).json({
      error: '修改密码失败'
    });
  }
});

// 删除账户（软删除）
router.delete('/account', authenticateToken, async (req, res) => {
  const db = getDB();

  try {
    // 取消所有活跃的拼车请求
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE ride_requests SET status = "cancelled" WHERE user_id = ? AND status = "active"',
        [req.user.userId],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });

    // 删除用户记录（硬删除）
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM users WHERE id = ?', [req.user.userId], function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });

    db.close();

    res.json({
      message: '账户删除成功'
    });

  } catch (error) {
    db.close();
    console.error('删除账户错误:', error);
    res.status(500).json({
      error: '删除账户失败'
    });
  }
});

module.exports = router;