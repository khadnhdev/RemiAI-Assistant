const bcrypt = require('bcryptjs');
const db = require('../config/database');

class AdminController {
  getLogin(req, res) {
    if (req.session.isAuthenticated) {
      return res.redirect('/dashboard');
    }
    res.render('admin/login', {
      title: 'Đăng nhập'
    });
  }

  postLogin(req, res) {
    const { password } = req.body;
    
    console.log('Đang xác thực mật khẩu...');

    // Kiểm tra xem bảng admins có tồn tại không
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='admins'", (err, table) => {
      if (err) {
        console.error('Lỗi kiểm tra bảng:', err);
        req.flash('error_msg', 'Có lỗi xảy ra khi xác thực');
        return res.redirect('/login');
      }
      
      if (!table) {
        console.error('Bảng admins không tồn tại! Đang tạo...');
        this.createAdminTable(req, res, password);
        return;
      }
      
      // Kiểm tra xem có admin nào trong hệ thống chưa
      db.get('SELECT COUNT(*) as count FROM admins', (err, row) => {
        if (err) {
          console.error('Lỗi đếm admin:', err);
          req.flash('error_msg', 'Có lỗi xảy ra khi xác thực');
          return res.redirect('/login');
        }
        
        // Nếu không có admin nào, tạo admin mặc định
        if (row.count === 0) {
          console.log('Không có admin nào trong hệ thống. Đang tạo admin mặc định...');
          this.createDefaultAdmin(req, res, password);
          return;
        }
        
        // Nếu có nhiều hơn 1 admin, xóa tất cả và tạo lại 1 admin duy nhất
        if (row.count > 1) {
          console.log('Phát hiện nhiều admin. Đang xóa và tạo lại admin duy nhất...');
          db.run('DELETE FROM admins', (err) => {
            if (err) {
              console.error('Lỗi khi xóa admin:', err);
              req.flash('error_msg', 'Có lỗi xảy ra khi xác thực');
              return res.redirect('/login');
            }
            this.createDefaultAdmin(req, res, password);
          });
          return;
        }
        
        // Tiếp tục xác thực nếu chỉ có 1 admin
        db.get('SELECT * FROM admins LIMIT 1', (err, admin) => {
          if (err) {
            console.error('Lỗi truy vấn database:', err);
            req.flash('error_msg', 'Có lỗi xảy ra khi xác thực');
            return res.redirect('/login');
          }
          
          console.log('Admin ID:', admin.id);
          console.log('Hashed password từ DB:', admin.password);
          
          // So sánh mật khẩu người dùng nhập với mật khẩu trong DB
          bcrypt.compare(password, admin.password, (err, isMatch) => {
            if (err) {
              console.error('Lỗi khi so sánh mật khẩu:', err);
              req.flash('error_msg', 'Có lỗi xảy ra khi xác thực');
              return res.redirect('/login');
            }
            
            console.log('Kết quả so sánh mật khẩu:', isMatch);
            
            if (isMatch) {
              req.session.isAuthenticated = true;
              req.flash('success_msg', 'Đăng nhập thành công');
              return res.redirect('/dashboard');
            } else {
              // Kiểm tra xem mật khẩu có trùng với .env không
              const envPassword = process.env.ADMIN_PASSWORD;
              if (envPassword && password === envPassword) {
                // Cập nhật mật khẩu admin nếu mật khẩu từ .env khớp
                console.log('Mật khẩu từ .env khớp. Đang cập nhật mật khẩu trong DB...');
                const hashedPassword = bcrypt.hashSync(envPassword, 10);
                db.run('UPDATE admins SET password = ? WHERE id = ?', [hashedPassword, admin.id], (err) => {
                  if (err) {
                    console.error('Lỗi khi cập nhật mật khẩu:', err);
                  } else {
                    console.log('Đã cập nhật mật khẩu admin theo .env');
                  }
                  req.session.isAuthenticated = true;
                  req.flash('success_msg', 'Đăng nhập thành công (mật khẩu từ .env)');
                  return res.redirect('/dashboard');
                });
              } else {
                console.log('Mật khẩu không khớp');
                req.flash('error_msg', 'Mật khẩu không chính xác');
                return res.redirect('/login');
              }
            }
          });
        });
      });
    });
  }

  // Hàm tạo bảng admin
  createAdminTable(req, res, password) {
    db.run(`CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Lỗi khi tạo bảng admins:', err);
        req.flash('error_msg', 'Không thể khởi tạo cơ sở dữ liệu');
        return res.redirect('/login');
      }
      
      console.log('Đã tạo bảng admins thành công');
      this.createDefaultAdmin(req, res, password);
    });
  }

  // Hàm tạo admin mặc định
  createDefaultAdmin(req, res, password) {
    const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
    const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
    
    db.run('INSERT INTO admins (password) VALUES (?)', [hashedPassword], (err) => {
      if (err) {
        console.error('Lỗi khi thêm admin:', err);
        req.flash('error_msg', 'Không thể tạo tài khoản admin');
        return res.redirect('/login');
      }
      
      console.log(`Đã tạo tài khoản admin duy nhất với mật khẩu từ .env`);
      
      // Thử đăng nhập với mật khẩu vừa nhập
      if (password === defaultPassword) {
        req.session.isAuthenticated = true;
        req.flash('success_msg', 'Đăng nhập thành công với tài khoản admin');
        return res.redirect('/dashboard');
      } else {
        req.flash('error_msg', `Mật khẩu không đúng. Vui lòng sử dụng mật khẩu trong .env`);
        return res.redirect('/login');
      }
    });
  }

  getDashboard(req, res) {
    res.render('admin/dashboard', {
      title: 'Dashboard'
    });
  }

  logout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        return console.log(err);
      }
      res.redirect('/login');
    });
  }
}

module.exports = new AdminController(); 