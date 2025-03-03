const db = require('../config/database');

class Reminder {
  static getAll(callback) {
    const sql = `
      SELECT r.*, a.name as ai_config_name, 
      (SELECT COUNT(*) FROM reminder_recipients WHERE reminder_id = r.id) as recipient_count
      FROM reminders r
      LEFT JOIN ai_configs a ON r.ai_config_id = a.id
      ORDER BY r.created_at DESC
    `;
    db.all(sql, [], callback);
  }

  static getById(id, callback) {
    console.log(`Đang truy vấn reminder với ID: ${id}`);
    const sql = `
      SELECT r.*, a.name as ai_config_name, rc.name as recipient_name, rc.email as recipient_email
      FROM reminders r
      LEFT JOIN ai_configs a ON r.ai_config_id = a.id
      LEFT JOIN recipients rc ON r.recipient_id = rc.id
      WHERE r.id = ?
    `;
    db.get(sql, [id], (err, reminder) => {
      if (err) {
        console.error(`Lỗi khi truy vấn reminder id=${id}:`, err);
      } else if (!reminder) {
        console.log(`Không tìm thấy reminder với id=${id}`);
      } else {
        console.log(`Đã tìm thấy reminder:`, reminder);
      }
      callback(err, reminder);
    });
  }

  static getActiveReminders(callback) {
    const sql = `
      SELECT * FROM reminders 
      WHERE active = 1
    `;
    db.all(sql, [], callback);
  }

  static getRecipientsByReminderId(reminderId, callback) {
    // Lấy recipient_id từ reminder
    this.getById(reminderId, (err, reminder) => {
      if (err) {
        return callback(err);
      }
      
      if (!reminder || !reminder.recipient_id) {
        return callback(null, []);
      }
      
      // Lấy thông tin người nhận
      db.get('SELECT * FROM recipients WHERE id = ?', [reminder.recipient_id], (err, recipient) => {
        if (err) {
          return callback(err);
        }
        
        // Trả về dưới dạng mảng để tương thích với code hiện tại
        callback(null, recipient ? [recipient] : []);
      });
    });
  }

  static create(reminderData, callback) {
    console.log('Creating reminder with data:', reminderData);
    const {
      title,
      recipient_id,
      ai_config_id,
      schedule,
      schedule_type,
      schedule_data,
      active
    } = reminderData;
    
    let scheduleDataJSON;
    try {
      scheduleDataJSON = typeof schedule_data === 'string' 
        ? schedule_data 
        : JSON.stringify(schedule_data || {});
    } catch (error) {
      console.error('Error stringifying schedule_data:', error);
      scheduleDataJSON = '{}';
    }
    
    console.log('SQL params:', [title, recipient_id, ai_config_id, schedule, schedule_type, scheduleDataJSON, active]);
    
    db.run(
      'INSERT INTO reminders (title, recipient_id, ai_config_id, schedule, schedule_type, schedule_data, active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, recipient_id, ai_config_id, schedule, schedule_type, scheduleDataJSON, active],
      function(err) {
        if (err) {
          console.error('Database error in create reminder:', err);
          return callback(err);
        }
        console.log('Reminder created with ID:', this.lastID);
        callback(null, this.lastID);
      }
    );
  }

  static update(id, reminder, callback) {
    const { title, recipient_id, ai_config_id, schedule, schedule_type, schedule_data, active } = reminder;
    
    console.log('-------------------------------------');
    console.log('UPDATING REMINDER:', id);
    console.log('Active value received:', active);
    console.log('Type of active:', typeof active);
    console.log('Active after conversion:', active ? 1 : 0);
    console.log('-------------------------------------');
    
    // Đảm bảo schedule_data là JSON string
    let scheduleDataJSON;
    try {
      scheduleDataJSON = typeof schedule_data === 'string' 
        ? schedule_data 
        : JSON.stringify(schedule_data || {});
    } catch (error) {
      console.error('Error stringifying schedule_data for update:', error);
      scheduleDataJSON = '{}';
    }
    
    // Thực hiện update từng trường một để debug
    db.run(
      'UPDATE reminders SET active = ? WHERE id = ?',
      [active ? 1 : 0, id],
      function(err) {
        if (err) {
          console.error('Lỗi khi cập nhật active:', err);
        } else {
          console.log('Cập nhật active thành công. Changes:', this.changes);
        }
        
        // Tiếp tục update các trường khác
        db.run(
          'UPDATE reminders SET title = ?, recipient_id = ?, ai_config_id = ?, schedule = ?, schedule_type = ?, schedule_data = ? WHERE id = ?',
          [title, recipient_id, ai_config_id, schedule, schedule_type, scheduleDataJSON, id],
          function(err) {
            if (err) {
              console.error('Lỗi khi cập nhật các trường khác:', err);
            } else {
              console.log('Cập nhật các trường khác thành công. Changes:', this.changes);
            }
            callback(err);
          }
        );
      }
    );
  }

  static incrementSendCount(id, callback) {
    const sql = 'UPDATE reminders SET send_count = send_count + 1 WHERE id = ?';
    db.run(sql, [id], callback);
  }

  static delete(id, callback) {
    // First delete from junction table
    db.run('DELETE FROM reminder_recipients WHERE reminder_id = ?', [id], err => {
      if (err) {
        return callback(err);
      }
      
      // Then delete the reminder
      db.run('DELETE FROM reminders WHERE id = ?', [id], callback);
    });
  }
}

module.exports = Reminder; 