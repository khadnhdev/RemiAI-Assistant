const db = require('../config/database');

console.log('Kiểm tra cấu trúc bảng email_history...');

// Lấy thông tin cấu trúc bảng
db.all("PRAGMA table_info(email_history)", (err, columns) => {
  if (err) {
    console.error('Lỗi khi kiểm tra cấu trúc bảng:', err);
    process.exit(1);
  }

  console.log('\nCấu trúc bảng email_history:');
  columns.forEach(col => {
    console.log(`- ${col.name} (${col.type})`);
  });

  // Kiểm tra dữ liệu trong bảng
  db.all("SELECT * FROM email_history ORDER BY id DESC LIMIT 5", (err, rows) => {
    if (err) {
      console.error('Lỗi khi truy vấn dữ liệu:', err);
      process.exit(1);
    }

    console.log('\n5 bản ghi gần nhất:');
    rows.forEach(row => {
      console.log('-'.repeat(50));
      console.log('ID:', row.id);
      console.log('Reminder ID:', row.reminder_id);
      console.log('Subject:', row.subject);
      console.log('Status:', row.status);
      if (row.content) {
        console.log('Content:', row.content.substring(0, 100) + '...');
      }
    });

    process.exit(0);
  });
}); 