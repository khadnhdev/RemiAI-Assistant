/**
 * Middleware xác thực người dùng
 * Kiểm tra session để xác định người dùng đã đăng nhập hay chưa
 */

// Middleware kiểm tra xác thực
exports.isAuthenticated = (req, res, next) => {
  if (req.session.isAuthenticated) {
    return next();
  }
  
  req.flash('error_msg', 'Vui lòng đăng nhập để truy cập');
  res.redirect('/login');
};

// Middleware kiểm tra người dùng đã đăng nhập (chuyển hướng nếu đã đăng nhập)
exports.isNotAuthenticated = (req, res, next) => {
  if (!req.session.isAuthenticated) {
    return next();
  }
  
  res.redirect('/dashboard');
}; 