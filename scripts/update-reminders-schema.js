require('dotenv').config();
const db = require('../config/database');

// Kiểm tra và cập nhật cấu trúc bảng
db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='reminders'", (err, result) => {
  if (err) {
    console.error('Lỗi khi kiểm tra bảng reminders:', err);
    process.exit(1);
  }
  
  if (!result) {
    console.error('Không tìm thấy bảng reminders');
    process.exit(1);
  }
  
  // Kiểm tra các cột hiện có
  db.all("PRAGMA table_info(reminders)", (err, columns) => {
    if (err) {
      console.error('Lỗi khi kiểm tra cột:', err);
      process.exit(1);
    }
    
    const columnNames = columns.map(col => col.name);
    
    // Thêm cột schedule_type nếu chưa có
    if (!columnNames.includes('schedule_type')) {
      db.run("ALTER TABLE reminders ADD COLUMN schedule_type TEXT DEFAULT 'daily'", (err) => {
        if (err) {
          console.error('Lỗi khi thêm cột schedule_type:', err);
        } else {
          console.log('Đã thêm cột schedule_type');
        }
      });
    }
    
    // Thêm cột schedule_data nếu chưa có
    if (!columnNames.includes('schedule_data')) {
      db.run("ALTER TABLE reminders ADD COLUMN schedule_data TEXT DEFAULT '{}'", (err) => {
        if (err) {
          console.error('Lỗi khi thêm cột schedule_data:', err);
        } else {
          console.log('Đã thêm cột schedule_data');
        }
      });
    }
    
    // Phân tích cú pháp cron từ các bản ghi hiện có
    db.all("SELECT id, schedule FROM reminders", (err, reminders) => {
      if (err) {
        console.error('Lỗi khi đọc dữ liệu reminders:', err);
        process.exit(1);
      }
      
      let updateCount = 0;
      reminders.forEach(reminder => {
        try {
          const parts = reminder.schedule.split(' ');
          
          // Phân tích cú pháp cron
          const minute = parseInt(parts[0]);
          const hour = parseInt(parts[1]);
          let scheduleType = 'daily';
          let scheduleData = { hour, minute };
          
          if (parts[2] !== '*' && parts[3] === '*' && parts[4] === '*') {
            // Monthly: minute hour date * *
            scheduleType = 'monthly';
            scheduleData.date = parseInt(parts[2]);
          } else if (parts[2] === '*' && parts[3] === '*' && parts[4] !== '*') {
            // Weekly: minute hour * * day
            scheduleType = 'weekly';
            scheduleData.day = parseInt(parts[4]);
          }
          
          // Cập nhật bản ghi
          db.run(
            "UPDATE reminders SET schedule_type = ?, schedule_data = ? WHERE id = ?",
            [scheduleType, JSON.stringify(scheduleData), reminder.id],
            function(err) {
              if (err) {
                console.error(`Lỗi khi cập nhật reminder ID ${reminder.id}:`, err);
              } else {
                updateCount++;
                if (updateCount === reminders.length) {
                  console.log(`Đã cập nhật dữ liệu lịch trình cho ${updateCount} nhắc nhở`);
                  process.exit(0);
                }
              }
            }
          );
        } catch (e) {
          console.error(`Lỗi khi phân tích cú pháp cron cho reminder ID ${reminder.id}:`, e);
        }
      });
      
      if (reminders.length === 0) {
        console.log('Không có nhắc nhở nào cần cập nhật');
        process.exit(0);
      }
    });
  });
}); 