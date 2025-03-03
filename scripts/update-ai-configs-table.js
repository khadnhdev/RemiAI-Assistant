const db = require('../config/database');

console.log('Cập nhật bảng ai_configs...');

// Thêm các cột mới
const alterQueries = [
  "ALTER TABLE ai_configs ADD COLUMN length TEXT DEFAULT 'Medium'",
  "ALTER TABLE ai_configs ADD COLUMN style TEXT DEFAULT 'Formal'",
  "ALTER TABLE ai_configs ADD COLUMN system_prompt TEXT"
];

// Thực hiện các truy vấn lần lượt
function runQuery(index) {
  if (index >= alterQueries.length) {
    console.log('Đã cập nhật xong bảng ai_configs');
    process.exit(0);
    return;
  }

  db.run(alterQueries[index], (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Lỗi khi thêm cột:', err);
    }
    runQuery(index + 1);
  });
}

// Bắt đầu cập nhật
runQuery(0); 