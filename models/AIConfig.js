const db = require('../config/database');

class AIConfig {
  static getAll(callback) {
    const sql = 'SELECT * FROM ai_configs ORDER BY created_at DESC';
    db.all(sql, [], callback);
  }

  static getById(id, callback) {
    const sql = `
      SELECT id, name, description, prompt_template,
             ai_model, tone, language,
             length, style, system_prompt,
             temperature, top_p, top_k, max_output_tokens
      FROM ai_configs 
      WHERE id = ?
    `;
    
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
      name, description, prompt_template, ai_model, 
      tone, language, length, style, system_prompt,
      temperature, top_p, top_k, max_output_tokens 
    } = config;
    
    // Kiểm tra xem có phải là cập nhật system prompt không
    if (system_prompt !== undefined) {
      const sql = `
        UPDATE ai_configs 
        SET language = ?, tone = ?, length = ?, style = ?, system_prompt = ?
        WHERE id = ?
      `;
      
      return db.run(sql, [language, tone, length, style, system_prompt, id], callback);
    }
    
    // Cập nhật đầy đủ thông tin
    const sql = `
      UPDATE ai_configs 
      SET name = ?, description = ?, prompt_template = ?, 
          ai_model = ?, tone = ?, language = ?,
          length = ?, style = ?, system_prompt = ?,
          temperature = ?, top_p = ?, top_k = ?, 
          max_output_tokens = ?
      WHERE id = ?
    `;
    
    db.run(sql, [
      name, description, prompt_template,
      ai_model, tone, language,
      length || 'Medium', style || 'Formal', system_prompt || '',
      temperature, top_p, top_k,
      max_output_tokens,
      id
    ], callback);
  }

  static delete(id, callback) {
    const sql = 'DELETE FROM ai_configs WHERE id = ?';
    db.run(sql, [id], callback);
  }
}

module.exports = AIConfig; 