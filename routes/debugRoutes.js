const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { isAuthenticated } = require('../middleware/auth');
const aiService = require('../services/aiService');

// Kiểm tra mật khẩu admin
router.get('/check-password', (req, res) => {
  // Chỉ cho phép trên localhost
  const clientIp = req.ip || req.connection.remoteAddress;
  if (clientIp !== '::1' && clientIp !== '127.0.0.1') {
    return res.status(403).send('Forbidden');
  }
  
  db.get('SELECT * FROM admins LIMIT 1', (err, admin) => {
    if (err) {
      return res.json({ error: err.message });
    }
    
    if (!admin) {
      return res.json({ error: 'Không tìm thấy admin' });
    }
    
    // Lấy mật khẩu đúng từ .env
    const correctPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    // So sánh với mật khẩu lưu trong DB
    bcrypt.compare(correctPassword, admin.password, (err, isMatch) => {
      if (err) {
        return res.json({ error: err.message });
      }
      
      res.json({
        admin_id: admin.id,
        stored_password_hash: admin.password,
        expected_password: correctPassword,
        is_match: isMatch,
        message: isMatch ? 'Mật khẩu khớp!' : 'Mật khẩu không khớp!',
        note: 'Hệ thống được thiết lập để sử dụng mật khẩu từ biến môi trường .env'
      });
    });
  });
});

// Cập nhật mật khẩu admin từ .env
router.get('/sync-admin-password', (req, res) => {
  // Chỉ cho phép trên localhost
  const clientIp = req.ip || req.connection.remoteAddress;
  if (clientIp !== '::1' && clientIp !== '127.0.0.1') {
    return res.status(403).send('Forbidden');
  }
  
  const envPassword = process.env.ADMIN_PASSWORD;
  if (!envPassword) {
    return res.json({ 
      error: 'Không tìm thấy ADMIN_PASSWORD trong .env',
      suggestion: 'Thêm ADMIN_PASSWORD=your_password vào file .env'
    });
  }
  
  const hashedPassword = bcrypt.hashSync(envPassword, 10);
  
  // Kiểm tra xem có admin nào không
  db.get('SELECT COUNT(*) as count FROM admins', (err, row) => {
    if (err) {
      return res.json({ error: err.message });
    }
    
    if (row.count === 0) {
      // Thêm admin mới
      db.run('INSERT INTO admins (password) VALUES (?)', [hashedPassword], (err) => {
        if (err) {
          return res.json({ error: err.message });
        }
        
        return res.json({
          success: true,
          message: 'Đã tạo admin mới với mật khẩu từ .env',
          password: envPassword,
          hashed: hashedPassword
        });
      });
    } else {
      // Cập nhật admin hiện tại
      db.run('UPDATE admins SET password = ? WHERE id = 1', [hashedPassword], (err) => {
        if (err) {
          return res.json({ error: err.message });
        }
        
        return res.json({
          success: true,
          message: 'Đã cập nhật mật khẩu admin theo .env',
          password: envPassword,
          hashed: hashedPassword
        });
      });
    }
  });
});

// Dùng middleware xác thực cho tất cả các route debug
router.use(isAuthenticated);

// Xem cấu trúc database
router.get('/db-structure', (req, res) => {
  const tables = [
    'recipients',
    'ai_configs',
    'reminders',
    'email_history'
  ];
  
  const promises = tables.map(table => {
    return new Promise((resolve, reject) => {
      db.get(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`, [table], (err, result) => {
        if (err) return reject(err);
        resolve({ table, structure: result ? result.sql : 'Table not found' });
      });
    });
  });
  
  Promise.all(promises)
    .then(results => {
      res.render('debug/db-structure', {
        title: 'Cấu trúc Database',
        tables: results
      });
    })
    .catch(err => {
      console.error('Lỗi khi truy vấn cấu trúc DB:', err);
      req.flash('error_msg', 'Lỗi khi truy vấn cấu trúc DB');
      res.redirect('/dashboard');
    });
});

// Test kết nối Gemini AI
router.get('/test-ai', (req, res) => {
  res.render('debug/test-ai', {
    title: 'Kiểm tra kết nối AI',
    apiKey: process.env.GEMINI_API_KEY ? '✓ Đã cấu hình' : '✗ Chưa cấu hình'
  });
});

// Thực hiện test Gemini AI
router.post('/test-ai', async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    req.flash('error_msg', 'Cần nhập prompt để kiểm tra');
    return res.redirect('/debug/test-ai');
  }
  
  try {
    const response = await aiService.testAI(prompt);
    
    res.render('debug/test-ai', {
      title: 'Kiểm tra kết nối AI',
      apiKey: process.env.GEMINI_API_KEY ? '✓ Đã cấu hình' : '✗ Chưa cấu hình',
      prompt,
      response
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra AI:', error);
    req.flash('error_msg', `Lỗi khi kiểm tra AI: ${error.message}`);
    res.redirect('/debug/test-ai');
  }
});

// Kiểm tra cài đặt Email
router.get('/test-email', (req, res) => {
  const emailConfig = {
    service: process.env.EMAIL_SERVICE || 'Chưa cấu hình',
    user: process.env.EMAIL_USER || 'Chưa cấu hình',
    pass: process.env.EMAIL_PASS ? '✓ Đã cấu hình' : '✗ Chưa cấu hình'
  };
  
  res.render('debug/test-email', {
    title: 'Kiểm tra cài đặt Email',
    emailConfig
  });
});

module.exports = router; 