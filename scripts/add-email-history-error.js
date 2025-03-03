const db = require('../config/database');

console.log('Bắt đầu thêm cột error vào bảng email_history...');

// Kiểm tra xem cột đã tồn tại chưa
db.all("PRAGMA table_info(email_history)", (err, columns) => {
  if (err) {
    console.error('Lỗi khi kiểm tra cấu trúc bảng:', err);
    process.exit(1);
  }

  const hasErrorColumn = columns.some(col => col.name === 'error');
  
  if (hasErrorColumn) {
    console.log('Cột error đã tồn tại trong bảng email_history');
    process.exit(0);
  }

  // Thêm cột error nếu chưa tồn tại
  db.run("ALTER TABLE email_history ADD COLUMN error TEXT", (err) => {
    if (err) {
      console.error('Lỗi khi thêm cột error:', err);
      process.exit(1);
    }
    
    console.log('Đã thêm cột error thành công!');
    process.exit(0);
  });
}); 