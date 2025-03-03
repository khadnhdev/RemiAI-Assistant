const db = require('../config/database');

console.log('Tạo bảng reminder_recipients...');

// Tạo bảng reminder_recipients
db.run(`
  CREATE TABLE IF NOT EXISTS reminder_recipients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reminder_id INTEGER NOT NULL,
    recipient_id INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reminder_id) REFERENCES reminders(id),
    FOREIGN KEY (recipient_id) REFERENCES recipients(id)
  )
`, function(err) {
  if (err) {
    console.error('Lỗi khi tạo bảng reminder_recipients:', err);
    process.exit(1);
  }
  
  console.log('Đã tạo bảng reminder_recipients thành công.');
  
  // Thêm dữ liệu cho bảng này từ recipient_id trong bảng reminders
  db.all("SELECT id, recipient_id FROM reminders WHERE recipient_id IS NOT NULL", (err, reminders) => {
    if (err) {
      console.error('Lỗi khi truy vấn dữ liệu reminders:', err);
      process.exit(1);
    }
    
    if (reminders.length === 0) {
      console.log('Không có dữ liệu để chuyển đổi.');
      process.exit(0);
    }
    
    let completed = 0;
    reminders.forEach(reminder => {
      db.run(
        'INSERT INTO reminder_recipients (reminder_id, recipient_id, is_active) VALUES (?, ?, 1)',
        [reminder.id, reminder.recipient_id],
        function(err) {
          completed++;
          if (err) {
            console.error(`Lỗi khi thêm dữ liệu cho reminder ${reminder.id}:`, err);
          } else {
            console.log(`Đã thêm người nhận cho reminder ${reminder.id}`);
          }
          
          if (completed === reminders.length) {
            console.log('Đã hoàn tất chuyển đổi dữ liệu.');
            process.exit(0);
          }
        }
      );
    });
  });
}); 