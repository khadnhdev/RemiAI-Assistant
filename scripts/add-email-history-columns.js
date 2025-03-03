const db = require('../config/database');

console.log('Kiểm tra và thêm cột content vào bảng email_history...');

// Kiểm tra cấu trúc bảng hiện tại
db.all("PRAGMA table_info(email_history)", (err, columns) => {
  if (err) {
    console.error('Lỗi khi kiểm tra cấu trúc bảng:', err);
    process.exit(1);
  }
  
  // Kiểm tra xem cột content đã tồn tại chưa
  const contentColumn = columns.find(col => col.name === 'content');
  
  if (contentColumn) {
    console.log('Cột content đã tồn tại trong bảng email_history');
    process.exit(0);
  }
  
  // Thêm cột content nếu chưa tồn tại
  console.log('Đang thêm cột content vào bảng email_history...');
  db.run('ALTER TABLE email_history ADD COLUMN content TEXT', function(err) {
    if (err) {
      console.error('Lỗi khi thêm cột content:', err);
      process.exit(1);
    }
    
    console.log('Đã thêm cột content thành công!');
    
    // Kiểm tra cấu trúc bảng hiện tại
    db.all("PRAGMA table_info(email_history)", (err, columns) => {
      if (err) {
        console.error('Lỗi khi kiểm tra cấu trúc bảng sau khi thêm cột:', err);
        process.exit(1);
      }
      
      console.log('Cấu trúc mới của bảng email_history:');
      columns.forEach(col => {
        console.log(`- ${col.name} (${col.type})`);
      });
      
      process.exit(0);
    });
  });
}); 