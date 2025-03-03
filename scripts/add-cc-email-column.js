const db = require('../config/database');

console.log('Thêm cột cc_email vào bảng email_history...');

db.run("ALTER TABLE email_history ADD COLUMN cc_email TEXT", (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Lỗi khi thêm cột cc_email:', err);
    process.exit(1);
  }
  
  console.log('Đã thêm cột cc_email thành công');
  
  // Cập nhật dữ liệu cũ
  db.run(`UPDATE email_history SET cc_email = ?`, [process.env.CC_EMAIL], (err) => {
    if (err) {
      console.error('Lỗi khi cập nhật dữ liệu cũ:', err);
    } else {
      console.log('Đã cập nhật cc_email cho dữ liệu cũ');
    }
    process.exit(0);
  });
}); 