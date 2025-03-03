const db = require('../config/database');

class Recipient {
  static getAll(callback) {
    const sql = 'SELECT * FROM recipients ORDER BY created_at DESC';
    db.all(sql, [], callback);
  }

  static getById(id, callback) {
    const sql = 'SELECT * FROM recipients WHERE id = ?';
    db.get(sql, [id], callback);
  }

  static create(recipient, callback) {
    const { name, email, phone, custom_attributes } = recipient;
    const sql = 'INSERT INTO recipients (name, email, phone, custom_attributes) VALUES (?, ?, ?, ?)';
    
    db.run(sql, [name, email, phone, JSON.stringify(custom_attributes || {})], function(err) {
      callback(err, this.lastID);
    });
  }

  static update(id, recipient, callback) {
    const { name, email, phone, custom_attributes } = recipient;
    const sql = 'UPDATE recipients SET name = ?, email = ?, phone = ?, custom_attributes = ? WHERE id = ?';
    
    db.run(sql, [name, email, phone, JSON.stringify(custom_attributes || {}), id], callback);
  }

  static delete(id, callback) {
    const sql = 'DELETE FROM recipients WHERE id = ?';
    db.run(sql, [id], callback);
  }
}

module.exports = Recipient; 