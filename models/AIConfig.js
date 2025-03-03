const db = require('../config/database');

class AIConfig {
  static getAll(callback) {
    const sql = 'SELECT * FROM ai_configs ORDER BY created_at DESC';
    db.all(sql, [], callback);
  }

  static getById(id, callback) {
    const sql = 'SELECT * FROM ai_configs WHERE id = ?';
    db.get(sql, [id], callback);
  }

  static create(config, callback) {
    const { 
      name, description, prompt_template, ai_model, tone, language,
      temperature, top_p, top_k, max_output_tokens
    } = config;
    
    const sql = `INSERT INTO ai_configs (
      name, description, prompt_template, ai_model, tone, language,
      temperature, top_p, top_k, max_output_tokens
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [
      name, description, prompt_template, ai_model, tone, language,
      temperature || 0.7, top_p || 0.95, top_k || 40, max_output_tokens || 1024
    ], function(err) {
      callback(err, this.lastID);
    });
  }

  static update(id, config, callback) {
    const { 
      name, description, prompt_template, ai_model, tone, language,
      temperature, top_p, top_k, max_output_tokens
    } = config;
    
    const sql = `UPDATE ai_configs SET 
      name = ?, description = ?, prompt_template = ?, ai_model = ?, tone = ?, language = ?,
      temperature = ?, top_p = ?, top_k = ?, max_output_tokens = ?,
      updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    
    db.run(sql, [
      name, description, prompt_template, ai_model, tone, language,
      temperature || 0.7, top_p || 0.95, top_k || 40, max_output_tokens || 1024,
      id
    ], callback);
  }

  static delete(id, callback) {
    const sql = 'DELETE FROM ai_configs WHERE id = ?';
    db.run(sql, [id], callback);
  }
}

module.exports = AIConfig; 