const db = require('../config/database');

// Kiểm tra và sửa cột active trong bảng reminders
console.log('Kiểm tra cột active trong bảng reminders...');

// 1. Kiểm tra thư mục database có quyền ghi không
const fs = require('fs');
const path = require('path');
const dbPath = path.resolve(__dirname, '../data/database.sqlite');

fs.access(dbPath, fs.constants.W_OK, (err) => {
  console.log(`Database tại ${dbPath} ${err ? 'KHÔNG' : 'CÓ'} quyền ghi`);
  
  if (err) {
    console.error('Error:', err);
    return;
  }

  // 2. Tìm cột active và kiểm tra loại dữ liệu
  db.all("PRAGMA table_info(reminders)", (err, columns) => {
    if (err) {
      console.error('Lỗi khi truy vấn cấu trúc bảng:', err);
      return;
    }

    const activeColumn = columns.find(col => col.name === 'active');
    
    if (!activeColumn) {
      console.log('Không tìm thấy cột active, tạo mới...');
      
      // Tạo cột active nếu chưa có
      db.run("ALTER TABLE reminders ADD COLUMN active INTEGER DEFAULT 1", function(err) {
        if (err) {
          console.error('Lỗi khi thêm cột active:', err);
        } else {
          console.log('Đã thêm cột active thành công!');
        }
      });
    } else {
      console.log('Cột active hiện tại:', activeColumn);
      
      // Sửa một bản ghi để test
      db.all("SELECT id FROM reminders LIMIT 1", (err, rows) => {
        if (err || !rows.length) {
          console.error('Không thể lấy bản ghi để test:', err);
          return;
        }
        
        const testId = rows[0].id;
        console.log(`Test update active=1 cho reminder ID=${testId}`);
        
        // Test update trực tiếp
        db.run("UPDATE reminders SET active = 1 WHERE id = ?", [testId], function(err) {
          if (err) {
            console.error('Lỗi khi update trực tiếp:', err);
          } else {
            console.log(`Update thành công: ${this.changes} rows affected`);
            
            // Kiểm tra kết quả
            db.get("SELECT id, active FROM reminders WHERE id = ?", [testId], (err, row) => {
              if (err) {
                console.error('Lỗi khi kiểm tra:', err);
              } else {
                console.log('Sau khi update trực tiếp:', row);
                
                // Test set active = 0
                db.run("UPDATE reminders SET active = 0 WHERE id = ?", [testId], function(err) {
                  if (err) {
                    console.error('Lỗi khi set active=0:', err);
                  } else {
                    console.log(`Set active=0: ${this.changes} rows affected`);
                    
                    db.get("SELECT id, active FROM reminders WHERE id = ?", [testId], (err, row) => {
                      console.log('Sau khi set active=0:', row);
                      console.log('Kiểm tra hoàn tất.');
                      process.exit(0);
                    });
                  }
                });
              }
            });
          }
        });
      });
    }
  });
}); 