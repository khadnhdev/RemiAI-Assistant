const db = require('../config/database');

db.all("SELECT * FROM ai_configs", [], (err, rows) => {
  if (err) {
    console.error('Lỗi query:', err);
  } else {
    console.log(`Found ${rows.length} AI configs:`);
    console.log(rows);
  }
  process.exit(0);
}); 