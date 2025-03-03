const db = require('../config/database');

class EmailHistory {
  static getAll(callback) {
    const sql = `
      SELECT h.*, r.title as reminder_title, rp.name as recipient_name, rp.email as recipient_email
      FROM email_history h
      JOIN reminders r ON h.reminder_id = r.id
      JOIN recipients rp ON h.recipient_id = rp.id
      ORDER BY h.sent_at DESC
    `;
    db.all(sql, [], callback);
  }

  static getByReminderId(reminderId, callback) {
    const sql = `
      SELECT h.*, rp.name as recipient_name, rp.email as recipient_email
      FROM email_history h
      JOIN recipients rp ON h.recipient_id = rp.id
      WHERE h.reminder_id = ?
      ORDER BY h.sent_at DESC
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