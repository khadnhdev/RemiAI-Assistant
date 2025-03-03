require('dotenv').config();
const db = require('../config/database');

// Kiểm tra cấu trúc bảng recipients
db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='recipients'", (err, result) => {
  if (err) {
    console.error('Lỗi khi kiểm tra bảng recipients:', err);
    process.exit(1);
  }
  
  if (!result) {
    console.log('Bảng recipients không tồn tại, đang tạo...');
    
    // Tạo bảng recipients nếu chưa tồn tại
    db.run(`CREATE TABLE IF NOT EXISTS recipients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      custom_attributes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Lỗi khi tạo bảng recipients:', err);
        process.exit(1);
      }
      
      console.log('Đã tạo bảng recipients thành công');
      process.exit(0);
    });
  } else {
    console.log('Bảng recipients đã tồn tại với cấu trúc:');
    console.log(result.sql);
    process.exit(0);
  }
}); 