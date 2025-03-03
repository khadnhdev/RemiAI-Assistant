const db = require('../config/database');

class RecipientController {
  getRecipients(req, res) {
    db.all('SELECT * FROM recipients ORDER BY created_at DESC', (err, recipients) => {
      if (err) {
        console.error('Lỗi khi truy vấn danh sách người nhận:', err);
        req.flash('error_msg', 'Lỗi khi tải danh sách người nhận');
        return res.redirect('/dashboard');
      }
      
      res.render('recipients/index', {
        recipients,
        title: 'Quản lý người nhận'
      });
    });
  }

  getCreateRecipient(req, res) {
    res.render('recipients/create', {
      title: 'Thêm người nhận mới'
    });
  }

  postCreateRecipient(req, res) {
    const { name, email, custom_attributes } = req.body;
    
    // Kiểm tra dữ liệu đầu vào cơ bản
    if (!name || !email) {
      req.flash('error_msg', 'Tên và email là bắt buộc');
      return res.redirect('/recipients/create');
    }
    
    // Kiểm tra định dạng email
    if (!/\S+@\S+\.\S+/.test(email)) {
      req.flash('error_msg', 'Email không hợp lệ');
      return res.redirect('/recipients/create');
    }
    
    // Kiểm tra và xử lý custom_attributes
    let parsedAttributes = null;
    if (custom_attributes && custom_attributes.trim() !== '') {
      try {
        parsedAttributes = JSON.parse(custom_attributes);
        // Đảm bảo là một object
        if (typeof parsedAttributes !== 'object' || parsedAttributes === null) {
          throw new Error('Không phải là đối tượng JSON hợp lệ');
        }
      } catch (e) {
        console.error('Lỗi khi parse custom_attributes:', e);
        req.flash('error_msg', 'Thuộc tính tùy chỉnh không phải là JSON hợp lệ');
        return res.redirect('/recipients/create');
      }
    }
    
    // Kiểm tra xem email đã tồn tại chưa
    db.get('SELECT id FROM recipients WHERE email = ?', [email], (err, existingRecipient) => {
      if (err) {
        console.error('Lỗi khi kiểm tra email:', err);
        req.flash('error_msg', 'Có lỗi xảy ra khi tạo người nhận');
        return res.redirect('/recipients/create');
      }
      
      if (existingRecipient) {
        req.flash('error_msg', 'Email này đã được sử dụng');
        return res.redirect('/recipients/create');
      }
      
      // Lưu vào cơ sở dữ liệu
      const attributesJson = parsedAttributes ? JSON.stringify(parsedAttributes) : null;
      
      db.run(
        'INSERT INTO recipients (name, email, custom_attributes, created_at, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [name, email, attributesJson],
        function(err) {
          if (err) {
            console.error('Lỗi khi thêm người nhận:', err);
            req.flash('error_msg', 'Có lỗi xảy ra khi thêm người nhận');
            return res.redirect('/recipients/create');
          }
          
          console.log(`Đã thêm người nhận thành công với ID: ${this.lastID}`);
          req.flash('success_msg', 'Đã thêm người nhận thành công');
          res.redirect('/recipients');
        }
      );
    });
  }

  getEditRecipient(req, res) {
    const id = req.params.id;
    
    db.get('SELECT * FROM recipients WHERE id = ?', [id], (err, recipient) => {
      if (err || !recipient) {
        console.error('Lỗi khi tìm người nhận:', err);
        req.flash('error_msg', 'Không tìm thấy người nhận');
        return res.redirect('/recipients');
      }
      
      res.render('recipients/edit', {
        recipient,
        title: 'Chỉnh sửa người nhận'
      });
    });
  }

  postUpdateRecipient(req, res) {
    const id = req.params.id;
    const { name, email, custom_attributes } = req.body;
    
    // Kiểm tra dữ liệu đầu vào cơ bản
    if (!name || !email) {
      req.flash('error_msg', 'Tên và email là bắt buộc');
      return res.redirect(`/recipients/edit/${id}`);
    }
    
    // Kiểm tra định dạng email
    if (!/\S+@\S+\.\S+/.test(email)) {
      req.flash('error_msg', 'Email không hợp lệ');
      return res.redirect(`/recipients/edit/${id}`);
    }
    
    // Kiểm tra và xử lý custom_attributes
    let parsedAttributes = null;
    if (custom_attributes && custom_attributes.trim() !== '') {
      try {
        parsedAttributes = JSON.parse(custom_attributes);
        // Đảm bảo là một object
        if (typeof parsedAttributes !== 'object' || parsedAttributes === null) {
          throw new Error('Không phải là đối tượng JSON hợp lệ');
        }
      } catch (e) {
        console.error('Lỗi khi parse custom_attributes:', e);
        req.flash('error_msg', 'Thuộc tính tùy chỉnh không phải là JSON hợp lệ');
        return res.redirect(`/recipients/edit/${id}`);
      }
    }
    
    // Kiểm tra xem email đã tồn tại chưa (ngoại trừ bản ghi hiện tại)
    db.get('SELECT id FROM recipients WHERE email = ? AND id != ?', [email, id], (err, existingRecipient) => {
      if (err) {
        console.error('Lỗi khi kiểm tra email:', err);
        req.flash('error_msg', 'Có lỗi xảy ra khi cập nhật người nhận');
        return res.redirect(`/recipients/edit/${id}`);
      }
      
      if (existingRecipient) {
        req.flash('error_msg', 'Email này đã được sử dụng bởi người nhận khác');
        return res.redirect(`/recipients/edit/${id}`);
      }
      
      // Cập nhật vào cơ sở dữ liệu
      const attributesJson = parsedAttributes ? JSON.stringify(parsedAttributes) : null;
      
      db.run(
        'UPDATE recipients SET name = ?, email = ?, custom_attributes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [name, email, attributesJson, id],
        function(err) {
          if (err) {
            console.error('Lỗi khi cập nhật người nhận:', err);
            req.flash('error_msg', 'Có lỗi xảy ra khi cập nhật người nhận');
            return res.redirect(`/recipients/edit/${id}`);
          }
          
          req.flash('success_msg', 'Đã cập nhật người nhận thành công');
          res.redirect('/recipients');
        }
      );
    });
  }

  postDeleteRecipient(req, res) {
    const id = req.params.id;
    
    db.run('DELETE FROM recipients WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Lỗi khi xóa người nhận:', err);
        req.flash('error_msg', 'Có lỗi xảy ra khi xóa người nhận');
      } else {
        req.flash('success_msg', 'Đã xóa người nhận thành công');
      }
      
      res.redirect('/recipients');
    });
  }

  deleteRecipient(req, res) {
    const id = req.params.id;
    
    db.run('DELETE FROM recipients WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Lỗi khi xóa người nhận:', err);
        return res.status(500).json({ success: false, message: 'Lỗi khi xóa người nhận' });
      }
      
      return res.json({ success: true, message: 'Đã xóa người nhận thành công' });
    });
  }
}

module.exports = new RecipientController(); 