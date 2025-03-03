require('dotenv').config();
const db = require('../config/database');

// Kiểm tra cấu trúc bảng reminders
console.log('Checking reminders table schema...');
db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='reminders'", (err, result) => {
  if (err) {
    console.error('Error querying table schema:', err);
    process.exit(1);
  }
  
  console.log('Reminders table schema:', result ? result.sql : 'Table not found');
  
  if (result) {
    // Liệt kê tất cả các cột trong bảng
    db.all("PRAGMA table_info(reminders)", (err, columns) => {
      if (err) {
        console.error('Error querying columns:', err);
        process.exit(1);
      }
      
      console.log('\nColumns in reminders table:');
      columns.forEach(col => {
        console.log(`- ${col.name} (${col.type})${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
      });
      
      // Kiểm tra dữ liệu hiện có
      db.all("SELECT * FROM reminders LIMIT 1", (err, rows) => {
        if (err) {
          console.error('Error querying data:', err);
        } else if (rows && rows.length > 0) {
          console.log('\nSample reminder data:');
          console.log(rows[0]);
        } else {
          console.log('\nNo reminders found in database');
        }
        process.exit(0);
      });
    });
  } else {
    process.exit(1);
  }
}); 