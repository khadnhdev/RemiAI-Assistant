const db = require('../config/database');

console.log('Thêm cột error vào bảng email_history...');

// Thêm cột error
db.run("ALTER TABLE email_history ADD COLUMN error TEXT", (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Lỗi khi thêm cột error:', err);
    process.exit(1);
  }
  
  console.log('Đã thêm cột error thành công');
  process.exit(0);
}); 