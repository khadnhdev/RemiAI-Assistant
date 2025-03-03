const db = require('../config/database');

// Kiểm tra trường active trong bảng reminders
console.log('Kiểm tra trường active trong bảng reminders...');

// 1. Kiểm tra cấu trúc
db.all("PRAGMA table_info(reminders)", (err, columns) => {
  if (err) {
    console.error('Lỗi khi truy vấn cấu trúc bảng:', err);
    return;
  }

  // Tìm cột active
  const activeColumn = columns.find(col => col.name === 'active');
  
  if (activeColumn) {
    console.log('Cột active tồn tại với thông tin:', activeColumn);
  } else {
    console.error('KHÔNG TÌM THẤY cột active trong bảng!');
  }

  // 2. Kiểm tra dữ liệu hiện tại
  db.all("SELECT id, title, active FROM reminders", (err, rows) => {
    if (err) {
      console.error('Lỗi khi truy vấn dữ liệu reminders:', err);
      return;
    }

    console.log('\nDữ liệu active hiện tại:');
    rows.forEach(row => {
      console.log(`ID: ${row.id}, Title: ${row.title}, Active: ${row.active} (Type: ${typeof row.active})`);
    });

    // 3. Thử cập nhật một bản ghi để kiểm tra
    if (rows.length > 0) {
      const testId = rows[0].id;
      const newActive = rows[0].active ? 0 : 1;
      
      console.log(`\nThử đổi giá trị active cho reminder ID ${testId} thành ${newActive}...`);
      
      db.run("UPDATE reminders SET active = ? WHERE id = ?", [newActive, testId], function(err) {
        if (err) {
          console.error('Lỗi khi cập nhật giá trị active:', err);
        } else {
          console.log(`Cập nhật thành công! Rows affected: ${this.changes}`);
          
          // Kiểm tra lại sau khi cập nhật
          db.get("SELECT id, title, active FROM reminders WHERE id = ?", [testId], (err, row) => {
            if (err) {
              console.error('Lỗi khi kiểm tra sau khi cập nhật:', err);
            } else {
              console.log(`Sau khi cập nhật: ID: ${row.id}, Title: ${row.title}, Active: ${row.active}`);
            }
            
            console.log('Hoàn tất kiểm tra.');
            process.exit(0);
          });
        }
      });
    } else {
      console.log('Không có dữ liệu để kiểm tra cập nhật.');
      process.exit(0);
    }
  });
}); 