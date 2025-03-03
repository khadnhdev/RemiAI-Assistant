require('dotenv').config();
const db = require('../config/database');

// Kiểm tra cấu trúc bảng reminders
db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='reminders'", (err, result) => {
  if (err) {
    console.error('Lỗi khi kiểm tra bảng reminders:', err);
    process.exit(1);
  }
  
  console.log('Cấu trúc bảng reminders:', result ? result.sql : 'Không tìm thấy bảng');
  
  // Kiểm tra các cột trong bảng reminders
  if (result) {
    db.all("PRAGMA table_info(reminders)", (err, columns) => {
      if (err) {
        console.error('Lỗi khi kiểm tra cột:', err);
        process.exit(1);
      }
      
      console.log('Các cột trong bảng reminders:');
      columns.forEach(col => {
        console.log(`- ${col.name} (${col.type})`);
      });
      
      process.exit(0);
    });
  } else {
    process.exit(1);
  }
}); 