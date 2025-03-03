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
    const { reminder_id, recipient_id, subject, content, status } = history;
    const sql = `
      INSERT INTO email_history (reminder_id, recipient_id, subject, content, status)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    db.run(sql, [reminder_id, recipient_id, subject, content, status], function(err) {
      callback(err, this.lastID);
    });
  }
}

module.exports = EmailHistory; 