const db = require('../config/database');

console.log('Thêm các cột còn thiếu vào bảng reminders...');

// Thêm cột max_sends nếu chưa có
db.run("ALTER TABLE reminders ADD COLUMN max_sends INTEGER DEFAULT 0", function(err) {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Lỗi khi thêm cột max_sends:', err);
  } else {
    console.log('Đã thêm cột max_sends hoặc cột đã tồn tại');
  }
  
  // Thêm cột send_count nếu chưa có
  db.run("ALTER TABLE reminders ADD COLUMN send_count INTEGER DEFAULT 0", function(err) {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Lỗi khi thêm cột send_count:', err);
    } else {
      console.log('Đã thêm cột send_count hoặc cột đã tồn tại');
    }
    
    console.log('Hoàn tất kiểm tra và sửa cấu trúc bảng.');
  });
}); 