require('dotenv').config();
const db = require('../config/database');

// Kiểm tra và sửa cấu trúc bảng reminders
console.log('Kiểm tra và sửa cấu trúc bảng reminders...');

db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='reminders'", (err, result) => {
  if (err) {
    console.error('Lỗi khi truy vấn thông tin bảng:', err);
    process.exit(1);
  }
  
  if (!result) {
    console.log('Bảng reminders không tồn tại, tạo mới...');
    
    db.run(`CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      recipient_id INTEGER,
      ai_config_id INTEGER,
      content TEXT,
      schedule TEXT NOT NULL,
      schedule_type TEXT DEFAULT 'daily',
      schedule_data TEXT DEFAULT '{}',
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Lỗi khi tạo bảng reminders:', err);
        process.exit(1);
      }
      console.log('Đã tạo bảng reminders thành công!');
      process.exit(0);
    });
    return;
  }
  
  // Kiểm tra các cột hiện có
  db.all("PRAGMA table_info(reminders)", (err, columns) => {
    if (err) {
      console.error('Lỗi khi kiểm tra cột:', err);
      process.exit(1);
    }
    
    const columnNames = columns.map(col => col.name);
    console.log('Cột hiện tại:', columnNames);
    
    // Danh sách cột cần có
    const requiredColumns = [
      { name: 'id', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
      { name: 'title', type: 'TEXT NOT NULL' },
      { name: 'recipient_id', type: 'INTEGER' },
      { name: 'ai_config_id', type: 'INTEGER' },
      { name: 'content', type: 'TEXT' },
      { name: 'schedule', type: 'TEXT NOT NULL' },
      { name: 'schedule_type', type: 'TEXT DEFAULT "daily"' },
      { name: 'schedule_data', type: 'TEXT DEFAULT "{}"' },
      { name: 'active', type: 'INTEGER DEFAULT 1' },
      { name: 'created_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' },
      { name: 'updated_at', type: 'DATETIME DEFAULT CURRENT_TIMESTAMP' }
    ];
    
    // Kiểm tra và thêm các cột thiếu
    let missingColumns = [];
    
    for (const col of requiredColumns) {
      if (!columnNames.includes(col.name)) {
        missingColumns.push(col);
      }
    }
    
    if (missingColumns.length === 0) {
      console.log('Cấu trúc bảng reminders đã đầy đủ.');
      process.exit(0);
      return;
    }
    
    console.log('Cột cần thêm:', missingColumns.map(col => col.name));
    
    // Thêm các cột thiếu
    let completed = 0;
    missingColumns.forEach(col => {
      console.log(`Thêm cột ${col.name}...`);
      db.run(`ALTER TABLE reminders ADD COLUMN ${col.name} ${col.type}`, (err) => {
        if (err) {
          console.error(`Lỗi khi thêm cột ${col.name}:`, err);
        } else {
          console.log(`Đã thêm cột ${col.name} thành công!`);
        }
        
        completed++;
        if (completed === missingColumns.length) {
          console.log('Đã hoàn tất cập nhật cấu trúc bảng!');
          process.exit(0);
        }
      });
    });
  });
}); 