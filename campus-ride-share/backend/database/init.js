const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建数据库文件路径
const dbPath = path.join(__dirname, '../database/campus_ride_share.db');

// 初始化数据库（同步版本，按顺序执行）
const initDatabase = () => {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('数据库连接错误:', err.message);
      return;
    }
    console.log('已连接到SQLite数据库');

    db.serialize(() => {
      // 启用外键约束
      db.run('PRAGMA foreign_keys = ON');

      // 创建用户表
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id VARCHAR(20) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(50) NOT NULL,
          major VARCHAR(50) NOT NULL,
          personality INTEGER CHECK(personality BETWEEN 1 AND 5),
          phone VARCHAR(20),
          email VARCHAR(100),
          is_verified BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('创建用户表错误:', err);
      });

      // 创建车站表
      db.run(`
        CREATE TABLE IF NOT EXISTS stations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(100) NOT NULL,
          location VARCHAR(200) NOT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('创建车站表错误:', err);
        else {
          // 插入默认车站数据
          const stations = [
            { name: '北京南站', location: '北京市丰台区永外大街车站12号' },
            { name: '北京西站', location: '北京市丰台区莲花池东路118号' },
            { name: '北京站', location: '北京市东城区毛家湾胡同甲13号' },
            { name: '北京朝阳站', location: '北京市朝阳区建国门外大街1号' },
            { name: '清河站', location: '北京市海淀区清河街道安宁庄西路1号' }
          ];

          stations.forEach(station => {
            db.run('INSERT OR IGNORE INTO stations (name, location) VALUES (?, ?)',
              [station.name, station.location],
              (err) => {
                if (err) console.error('插入车站数据错误:', err);
              }
            );
          });
        }
      });

      // 创建拼车请求表
      db.run(`
        CREATE TABLE IF NOT EXISTS ride_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          station_id INTEGER NOT NULL,
          departure_time DATETIME NOT NULL,
          max_passengers INTEGER DEFAULT 4,
          current_passengers INTEGER DEFAULT 1,
          status VARCHAR(20) DEFAULT 'active',
          note TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (station_id) REFERENCES stations(id)
        )
      `, (err) => {
        if (err) console.error('创建拼车请求表错误:', err);
      });

      // 创建匹配记录表
      db.run(`
        CREATE TABLE IF NOT EXISTS matches (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          requester_id INTEGER NOT NULL,
          matched_user_id INTEGER NOT NULL,
          ride_request_id INTEGER NOT NULL,
          match_score INTEGER NOT NULL,
          breakdown VARCHAR(200),
          status VARCHAR(20) DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (matched_user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (ride_request_id) REFERENCES ride_requests(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('创建匹配记录表错误:', err);
      });

      // 创建乘客表（记录谁加入了哪个拼车）
      db.run(`
        CREATE TABLE IF NOT EXISTS ride_passengers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ride_request_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ride_request_id) REFERENCES ride_requests(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('创建乘客表错误:', err);
        else {
          // 创建索引以提高查询性能
          db.run('CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id)');
          db.run('CREATE INDEX IF NOT EXISTS idx_ride_requests_user_id ON ride_requests(user_id)');
          db.run('CREATE INDEX IF NOT EXISTS idx_ride_requests_status ON ride_requests(status)');
          db.run('CREATE INDEX IF NOT EXISTS idx_matches_requester_id ON matches(requester_id)');
          db.run('CREATE INDEX IF NOT EXISTS idx_matches_score ON matches(match_score)');
        }
      });
    });

    db.close((err) => {
      if (err) {
        console.error('关闭数据库错误:', err.message);
      } else {
        console.log('数据库初始化完成');
      }
    });
  });
};

// 如果直接运行此文件，则初始化数据库
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase, dbPath };