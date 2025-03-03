const db = require('../config/database');

console.log('Bắt đầu thêm cột content vào bảng email_history...');

// Kiểm tra xem cột đã tồn tại chưa
db.all("PRAGMA table_info(email_history)", (err, columns) => {
  if (err) {
    console.error('Lỗi khi kiểm tra cấu trúc bảng:', err);
    process.exit(1);
  }

  const hasContentColumn = columns.some(col => col.name === 'content');
  
  if (hasContentColumn) {
    console.log('Cột content đã tồn tại trong bảng email_history');
    process.exit(0);
  }

  // Thêm cột content nếu chưa tồn tại
  db.run("ALTER TABLE email_history ADD COLUMN content TEXT", (err) => {
    if (err) {
      console.error('Lỗi khi thêm cột content:', err);
      process.exit(1);
    }
    
    console.log('Đã thêm cột content thành công!');
    
    // Kiểm tra lại cấu trúc bảng
    db.all("PRAGMA table_info(email_history)", (err, updatedColumns) => {
      if (err) {
        console.error('Lỗi khi kiểm tra cấu trúc bảng sau khi thêm cột:', err);
      } else {
        console.log('\nCấu trúc bảng email_history sau khi cập nhật:');
        updatedColumns.forEach(col => {
          console.log(`- ${col.name} (${col.type})`);
        });
      }
      process.exit(0);
    });
  });
}); 