const db = require('./database');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Kiểm tra xem database đã được khởi tạo chưa
const dbInitPath = path.join(__dirname, '../data/.db_initialized');

function initializeDatabase() {
  console.log('Bắt đầu khởi tạo database...');

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
    
    // Thêm admin mặc định nếu bảng trống
    db.get('SELECT COUNT(*) as count FROM admins', (err, row) => {
      if (err) {
        console.error('Lỗi khi kiểm tra dữ liệu admins:', err);
        return;
      }
      
      if (row.count === 0) {
        // Kiểm tra mật khẩu từ biến môi trường
        if (process.env.ADMIN_PASSWORD) {
          console.log('Sử dụng mật khẩu từ biến môi trường');
          // Kiểm tra xem mật khẩu đã được mã hóa chưa
          const passwordToStore = process.env.ADMIN_PASSWORD.startsWith('$2a$') || 
                                 process.env.ADMIN_PASSWORD.startsWith('$2b$') ? 
                                 process.env.ADMIN_PASSWORD : 
                                 bcrypt.hashSync(process.env.ADMIN_PASSWORD, 10);
          
          console.log('Lưu mật khẩu đã hash:', passwordToStore);
          
          db.run('INSERT INTO admins (password) VALUES (?)', [passwordToStore], (err) => {
            if (err) {
              console.error('Lỗi khi thêm admin mặc định:', err);
            } else {
              console.log('Đã thêm admin mặc định.');
            }
          });
        } else {
          // Nếu không có trong biến môi trường, sử dụng mật khẩu mặc định
          const defaultPassword = 'admin123';
          const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
          console.log('Sử dụng mật khẩu mặc định (admin123)');
          console.log('Mật khẩu sau khi hash:', hashedPassword);
          
          db.run('INSERT INTO admins (password) VALUES (?)', [hashedPassword], (err) => {
            if (err) {
              console.error('Lỗi khi thêm admin mặc định:', err);
            } else {
              console.log('Đã thêm admin mặc định với mật khẩu: admin123');
            }
          });
        }
      }
    });
  });

  // Tạo bảng recipients
  db.run(`CREATE TABLE IF NOT EXISTS recipients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    custom_attributes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Lỗi khi tạo bảng recipients:', err);
    } else {
      console.log('Đã tạo bảng recipients.');
    }
  });

  // Tạo bảng ai_configs
  db.run(`CREATE TABLE IF NOT EXISTS ai_configs (
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
  )`, (err) => {
    if (err) {
      console.error('Lỗi khi tạo bảng ai_configs:', err);
    } else {
      console.log('Đã tạo bảng ai_configs.');
    }
  });

  // Tạo bảng reminders
  db.run(`CREATE TABLE IF NOT EXISTS reminders (
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
  )`, (err) => {
    if (err) {
      console.error('Lỗi khi tạo bảng reminders:', err);
    } else {
      console.log('Đã tạo bảng reminders.');
    }
  });

  // Tạo bảng recipient_reminders
  db.run(`CREATE TABLE IF NOT EXISTS recipient_reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_id INTEGER,
    reminder_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipient_id) REFERENCES recipients(id) ON DELETE CASCADE,
    FOREIGN KEY (reminder_id) REFERENCES reminders(id) ON DELETE CASCADE
  )`, (err) => {
    if (err) {
      console.error('Lỗi khi tạo bảng recipient_reminders:', err);
    } else {
      console.log('Đã tạo bảng recipient_reminders.');
    }
  });

  // Tạo bảng email_history
  db.run(`CREATE TABLE IF NOT EXISTS email_history (
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
  )`, (err) => {
    if (err) {
      console.error('Lỗi khi tạo bảng email_history:', err);
    } else {
      console.log('Đã tạo bảng email_history.');
    }
  });

  // Đánh dấu rằng database đã được khởi tạo
  fs.writeFileSync(dbInitPath, new Date().toISOString());
  console.log('Database đã được khởi tạo thành công.');
}

// Kiểm tra và khởi tạo database nếu cần
if (!fs.existsSync(dbInitPath)) {
  initializeDatabase();
} else {
  console.log('Database đã được khởi tạo trước đó. Bỏ qua khởi tạo.');
}

module.exports = db; 