function isAuthenticated(req, res, next) {
  if (req.session.isAuthenticated) {
    return next();
  }
  req.flash('error_msg', 'Vui lòng đăng nhập để truy cập');
  res.redirect('/login');
}

module.exports = {
  isAuthenticated
}; 