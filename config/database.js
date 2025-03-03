const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Đường dẫn đến thư mục data
const dbDir = path.join(__dirname, '../data');
const dbPath = path.join(dbDir, 'database.sqlite');

// Đảm bảo thư mục data tồn tại
if (!fs.existsSync(dbDir)) {
  try {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('Đã tạo thư mục data');
  } catch (err) {
    console.error('Lỗi khi tạo thư mục data:', err);
    process.exit(1);
  }
}

// Kết nối đến database (sẽ tự động tạo nếu chưa tồn tại)
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Lỗi khi kết nối đến database:', err);
    process.exit(1);
  }
  console.log('Đã kết nối đến database SQLite.');
});

// Đặt pragmas cho SQLite
db.exec('PRAGMA foreign_keys = ON;', (err) => {
  if (err) {
    console.error('Lỗi khi thiết lập PRAGMA:', err);
  }
});

// Đảm bảo database được đóng khi ứng dụng kết thúc
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Lỗi khi đóng kết nối database:', err);
    } else {
      console.log('Đã đóng kết nối database.');
    }
    process.exit(0);
  });
});

function initDatabase() {
  // Create Recipients table
  db.run(`CREATE TABLE IF NOT EXISTS recipients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    custom_attributes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create AI Configurations table
  db.run(`CREATE TABLE IF NOT EXISTS ai_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    prompt_template TEXT NOT NULL,
    ai_model TEXT DEFAULT 'gpt-3.5-turbo',
    tone TEXT,
    language TEXT DEFAULT 'Vietnamese',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create Reminders table
  db.run(`CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    ai_config_id INTEGER,
    schedule_type TEXT NOT NULL, 
    schedule_data TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    max_sends INTEGER DEFAULT 0,
    send_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ai_config_id) REFERENCES ai_configs (id)
  )`);

  // Create Reminder Recipients junction table
  db.run(`CREATE TABLE IF NOT EXISTS reminder_recipients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reminder_id INTEGER NOT NULL,
    recipient_id INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (reminder_id) REFERENCES reminders (id),
    FOREIGN KEY (recipient_id) REFERENCES recipients (id)
  )`);

  // Create Email History table
  db.run(`CREATE TABLE IF NOT EXISTS email_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reminder_id INTEGER NOT NULL,
    recipient_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reminder_id) REFERENCES reminders (id),
    FOREIGN KEY (recipient_id) REFERENCES recipients (id)
  )`);
}

module.exports = db; 