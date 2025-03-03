require('dotenv').config();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();

// Đường dẫn đến thư mục data
const dbDir = path.join(__dirname, '../data');
const dbPath = path.join(dbDir, 'database.sqlite');
const dbInitPath = path.join(dbDir, '.db_initialized');

// Xóa file database cũ nếu tồn tại
console.log('Xóa database cũ nếu tồn tại');
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Đã xóa file database cũ');
}

// Xóa marker file
if (fs.existsSync(dbInitPath)) {
  fs.unlinkSync(dbInitPath);
  console.log('Đã xóa marker file');
}

// Đảm bảo thư mục data tồn tại
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('Đã tạo thư mục data');
}

// Kết nối đến database (sẽ tự động tạo file mới)
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Lỗi khi kết nối đến database:', err);
    process.exit(1);
  }
  console.log('Đã kết nối đến database SQLite mới.');
  
  // Tạo bảng admins
  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Lỗi khi tạo bảng admins:', err);
      process.exit(1);
    }
    console.log('Đã tạo bảng admins');
    
    // Thêm admin duy nhất với mật khẩu từ .env
    const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
    
    db.run('INSERT INTO admins (password) VALUES (?)', [hashedPassword], (err) => {
      if (err) {
        console.error('Lỗi khi thêm admin:', err);
        process.exit(1);
      }
      
      console.log('Đã thêm admin duy nhất với mật khẩu:', defaultPassword);
      console.log('Mật khẩu đã hash:', hashedPassword);
      
      // Khởi tạo các bảng khác
      initializeRemainingTables(db, () => {
        // Đánh dấu database đã được khởi tạo
        fs.writeFileSync(dbInitPath, new Date().toISOString());
        console.log('Database đã được khởi tạo lại thành công.');
        
        // Đóng kết nối
        db.close();
      });
    });
  });
});

function initializeRemainingTables(db, callback) {
  // Tạo các bảng khác của hệ thống
  const tables = [
    // Bảng recipients
    `CREATE TABLE IF NOT EXISTS recipients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      custom_attributes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Bảng ai_configs
    `CREATE TABLE IF NOT EXISTS ai_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      prompt_template TEXT NOT NULL,
      ai_model TEXT DEFAULT 'gemini-pro',
      tone TEXT DEFAULT 'professional',
      language TEXT DEFAULT 'Vietnamese',
      temperature REAL DEFAULT 0.7,
      top_p REAL DEFAULT 0.95,
      top_k INTEGER DEFAULT 40,
      max_output_tokens INTEGER DEFAULT 1024,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Bảng reminders và các bảng liên quan
    `CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      ai_config_id INTEGER,
      schedule_type TEXT NOT NULL,
      cron_expression TEXT,
      scheduled_date DATETIME,
      repeat_interval INTEGER,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ai_config_id) REFERENCES ai_configs(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS recipient_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient_id INTEGER,
      reminder_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE CASCADE,
      FOREIGN KEY (reminder_id) REFERENCES reminders(id) ON DELETE CASCADE
    )`,
    
    `CREATE TABLE IF NOT EXISTS email_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recipient_id INTEGER,
      reminder_id INTEGER,
      subject TEXT,
      body TEXT,
      status TEXT DEFAULT 'pending',
      sent_at DATETIME,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE SET NULL,
      FOREIGN KEY (reminder_id) REFERENCES reminders(id) ON DELETE SET NULL
    )`
  ];
  
  let completed = 0;
  
  tables.forEach((sql, index) => {
    db.run(sql, (err) => {
      if (err) {
        console.error(`Lỗi khi tạo bảng #${index + 1}:`, err);
      } else {
        console.log(`Đã tạo bảng #${index + 1} thành công`);
      }
      
      completed++;
      if (completed === tables.length) {
        callback();
      }
    });
  });
} 