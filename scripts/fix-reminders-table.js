require('dotenv').config();
const db = require('../config/database');

// Kiểm tra xem cột recipient_id có tồn tại không
db.all("PRAGMA table_info(reminders)", (err, columns) => {
  if (err) {
    console.error('Lỗi khi kiểm tra cấu trúc bảng:', err);
    process.exit(1);
  }
  
  // Kiểm tra từng cột
  const hasRecipientId = columns.some(col => col.name === 'recipient_id');
  const hasRecipient = columns.some(col => col.name === 'recipient');
  
  if (!hasRecipientId) {
    console.log('Không tìm thấy cột recipient_id, đang thêm vào...');
    
    if (hasRecipient) {
      // Nếu có cột recipient, đổi tên thành recipient_id
      db.run("ALTER TABLE reminders RENAME COLUMN recipient TO recipient_id", (err) => {
        if (err) {
          console.error('Lỗi khi đổi tên cột:', err);
          process.exit(1);
        }
        
        console.log('Đã đổi tên cột recipient thành recipient_id thành công!');
        process.exit(0);
      });
    } else {
      // Thêm cột recipient_id mới
      db.run("ALTER TABLE reminders ADD COLUMN recipient_id INTEGER REFERENCES recipients(id)", (err) => {
        if (err) {
          console.error('Lỗi khi thêm cột recipient_id:', err);
          process.exit(1);
        }
        
        console.log('Đã thêm cột recipient_id thành công!');
        process.exit(0);
      });
    }
  } else {
    console.log('Cột recipient_id đã tồn tại trong bảng reminders.');
    process.exit(0);
  }
}); 