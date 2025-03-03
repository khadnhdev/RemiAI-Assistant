const db = require('../config/database');

class EmailHistory {
  static getAll(callback) {
    const sql = `
      SELECT eh.*, r.title as reminder_title, rec.email as recipient_email
      FROM email_history eh
      LEFT JOIN reminders r ON eh.reminder_id = r.id
      LEFT JOIN recipients rec ON eh.recipient_id = rec.id
      ORDER BY eh.sent_at DESC
    `;
    db.all(sql, [], callback);
  }

  static getByReminderId(reminderId, callback) {
    const sql = `
      SELECT eh.*, rec.email as recipient_email
      FROM email_history eh
      LEFT JOIN recipients rec ON eh.recipient_id = rec.id
      WHERE eh.reminder_id = ?
      ORDER BY eh.sent_at DESC
    `;
    db.all(sql, [reminderId], callback);
  }

  static create(history, callback) {
    const { reminder_id, recipient_id, subject, content, status, error } = history;
    
    // Kiểm tra cấu trúc bảng trước khi insert
    db.all("PRAGMA table_info(email_history)", (err, columns) => {
      if (err) {
        return callback(err);
      }
      
      // Lấy danh sách tên cột
      const columnNames = columns.map(col => col.name);
      
      // Tạo câu lệnh SQL động dựa trên các cột có sẵn
      let fields = ['reminder_id', 'recipient_id', 'subject', 'status'];
      let values = [reminder_id, recipient_id, subject, status];
      
      // Thêm các cột tùy chọn nếu tồn tại
      if (columnNames.includes('error')) {
        fields.push('error');
        values.push(error);
      }
      
      if (columnNames.includes('cc_email')) {
        fields.push('cc_email');
        values.push(process.env.CC_EMAIL);
      }
      
      const sql = `
        INSERT INTO email_history (${fields.join(', ')})
        VALUES (${Array(fields.length).fill('?').join(', ')})
      `;
      
      db.run(sql, values, function(err) {
        if (err) {
          console.error('Error inserting into email_history:', err);
        }
        callback(err, this.lastID);
      });
    });
  }
}

module.exports = EmailHistory; 