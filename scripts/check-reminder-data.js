require('dotenv').config();
const db = require('../config/database');

// Kiểm tra dữ liệu của bảng reminders và các bảng liên quan
console.log('Kiểm tra dữ liệu bảng reminders...');

// 1. Kiểm tra cấu trúc bảng reminders
db.all("PRAGMA table_info(reminders)", (err, columns) => {
  if (err) {
    console.error('Lỗi khi truy vấn cấu trúc bảng:', err);
    return;
  }
  
  console.log('Cấu trúc bảng reminders:');
  columns.forEach(col => {
    console.log(`- ${col.name} (${col.type})`);
  });
  
  // 2. Kiểm tra dữ liệu trong bảng reminders
  db.all("SELECT * FROM reminders", (err, reminders) => {
    if (err) {
      console.error('Lỗi khi truy vấn dữ liệu reminders:', err);
      return;
    }
    
    console.log(`\nTìm thấy ${reminders.length} nhắc nhở:`);
    reminders.forEach(reminder => {
      console.log(`\nID: ${reminder.id}`);
      console.log(`Tiêu đề: ${reminder.title}`);
      console.log(`Người nhận ID: ${reminder.recipient_id}`);
      console.log(`AI config ID: ${reminder.ai_config_id}`);
      console.log(`Lịch gửi: ${reminder.schedule}`);
      console.log(`Loại lịch: ${reminder.schedule_type}`);
      console.log(`Trạng thái: ${reminder.active ? 'Đang hoạt động' : 'Tắt'}`);
    });
    
    // 3. Kiểm tra dữ liệu người nhận
    db.all("SELECT * FROM recipients", (err, recipients) => {
      if (err) {
        console.error('Lỗi khi truy vấn dữ liệu recipients:', err);
        return;
      }
      
      console.log(`\nTìm thấy ${recipients.length} người nhận:`);
      recipients.forEach(recipient => {
        console.log(`ID: ${recipient.id}, Tên: ${recipient.name}, Email: ${recipient.email}`);
      });
      
      // 4. Kiểm tra dữ liệu cấu hình AI
      db.all("SELECT * FROM ai_configs", (err, configs) => {
        if (err) {
          console.error('Lỗi khi truy vấn dữ liệu ai_configs:', err);
          return;
        }
        
        console.log(`\nTìm thấy ${configs.length} cấu hình AI:`);
        configs.forEach(config => {
          console.log(`ID: ${config.id}, Tên: ${config.name}`);
        });
        
        process.exit(0);
      });
    });
  });
}); 