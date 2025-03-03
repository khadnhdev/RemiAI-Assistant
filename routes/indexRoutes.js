const express = require('express');
const router = express.Router();
const { isAuthenticated, isNotAuthenticated } = require('../middleware/auth');

// Trang chủ - chuyển hướng đến dashboard nếu đã đăng nhập
router.get('/', (req, res) => {
  if (req.session.isAuthenticated) {
    return res.redirect('/dashboard');
  }
  res.redirect('/login');
});

// Trang đăng nhập
router.get('/login', isNotAuthenticated, (req, res) => {
  res.render('login', {
    title: 'Đăng nhập',
    layout: 'layouts/auth'
  });
});

// Xử lý đăng nhập
router.post('/login', isNotAuthenticated, (req, res) => {
  const { password } = req.body;
  
  // Kiểm tra mật khẩu so với biến môi trường
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAuthenticated = true;
    req.flash('success_msg', 'Đăng nhập thành công');
    res.redirect('/dashboard');
  } else {
    req.flash('error_msg', 'Mật khẩu không đúng');
    res.redirect('/login');
  }
});

// Đăng xuất
router.get('/logout', isAuthenticated, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Lỗi khi đăng xuất:', err);
      return res.redirect('/dashboard');
    }
    res.redirect('/login');
  });
});

module.exports = router; 