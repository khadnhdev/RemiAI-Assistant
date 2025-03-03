const Reminder = require('../models/Reminder');
const AIConfig = require('../models/AIConfig');
const Recipient = require('../models/Recipient');
const EmailHistory = require('../models/EmailHistory');
const schedulerService = require('../services/schedulerService');
const db = require('../config/database');

class ReminderController {
  getReminders(req, res) {
    // Truy vấn JOIN với recipient và ai_config
    const sql = `
      SELECT r.*, 
        rc.name as recipient_name, 
        rc.email as recipient_email,
        a.name as ai_config_name 
      FROM reminders r
      LEFT JOIN recipients rc ON r.recipient_id = rc.id
      LEFT JOIN ai_configs a ON r.ai_config_id = a.id
      ORDER BY r.created_at DESC
    `;
    
    db.all(sql, (err, reminders) => {
      if (err) {
        console.error('Lỗi khi truy vấn danh sách nhắc nhở:', err);
        req.flash('error_msg', 'Có lỗi xảy ra khi tải danh sách nhắc nhở');
        return res.redirect('/dashboard');
      }
      
      // Gỡ lỗi: in ra số lượng nhắc nhở
      console.log(`Đã tìm thấy ${reminders.length} nhắc nhở`);
      
      // Đảm bảo có giá trị mặc định khi NULL
      reminders.forEach(reminder => {
        if (!reminder.recipient_name) {
          reminder.recipient_name = 'Không có';
          reminder.recipient_email = '';
        }
        if (!reminder.ai_config_name) {
          reminder.ai_config_name = 'Không sử dụng';
        }
      });
      
      res.render('reminders/index', {
        reminders,
        title: 'Quản lý nhắc nhở'
      });
    });
  }

  getCreateReminder(req, res) {
    // Load AI configs for selection
    AIConfig.getAll((err, aiConfigs) => {
      if (err) {
        req.flash('error_msg', 'Lỗi khi tải danh sách cấu hình AI');
        return res.redirect('/reminders');
      }
      
      // Load recipients for selection
      Recipient.getAll((err, recipients) => {
        if (err) {
          req.flash('error_msg', 'Lỗi khi tải danh sách người nhận');
          return res.redirect('/reminders');
        }
        
        res.render('reminders/create', {
          aiConfigs,
          recipients,
          title: 'Tạo nhắc nhở mới'
        });
      });
    });
  }

  postCreateReminder(req, res) {
    console.log('Form data received:', req.body);
    console.log('Content-Type:', req.get('Content-Type'));
    
    const { 
      title, 
      recipient_id, 
      ai_config_id, 
      content,
      schedule_type,
      hour,
      minute,
      day,
      date,
      active,
      schedule  // Thêm schedule từ form hoặc từ JSON
    } = req.body;
    
    // Phân tích dữ liệu giờ và phút
    const hourValue = parseInt(hour) || 9;
    const minuteValue = parseInt(minute) || 0;
    
    // Ưu tiên sử dụng schedule từ form, nếu không có thì tạo mới
    const finalSchedule = schedule || `${minuteValue} ${hourValue} * * *`;
    
    // Tạo đối tượng nhắc nhở đơn giản hơn
    const newReminder = {
      title: title,
      recipient_id: recipient_id ? parseInt(recipient_id) : null,
      ai_config_id: ai_config_id ? parseInt(ai_config_id) : null,
      content: content || '',
      schedule: finalSchedule,
      schedule_type: schedule_type || 'daily',  // Dùng schedule_type từ form
      schedule_data: JSON.stringify({
        hour: hourValue, 
        minute: minuteValue,
        day: parseInt(day) || 1,
        date: parseInt(date) || 1
      }),
      active: active ? 1 : 0
    };
    
    console.log('New reminder object:', newReminder);
    
    Reminder.create(newReminder, (err, reminderId) => {
      if (err) {
        console.error('Error creating reminder:', err);
        req.flash('error_msg', 'Lỗi khi tạo nhắc nhở mới');
        return res.redirect('/reminders/create');
      }
      
      req.flash('success_msg', 'Đã tạo nhắc nhở mới thành công');
      
      // Tạm thời bỏ refresh scheduler - sẽ được cập nhật khi khởi động lại ứng dụng
      
      res.redirect('/reminders');
    });
  }

  getEditReminder(req, res) {
    const id = req.params.id;
    
    Reminder.getById(id, (err, reminder) => {
      if (err || !reminder) {
        req.flash('error_msg', 'Không tìm thấy nhắc nhở');
        return res.redirect('/reminders');
      }
      
      // Parse schedule_data nếu là string
      try {
        if (reminder.schedule_data && typeof reminder.schedule_data === 'string') {
          reminder.schedule_data = JSON.parse(reminder.schedule_data);
        }
      } catch (e) {
        console.error('Lỗi khi parse schedule_data:', e);
        reminder.schedule_data = {};
      }
      
      console.log('Đang chỉnh sửa reminder:', reminder);
      
      // Load AI configs for selection
      AIConfig.getAll((err, aiConfigs) => {
        if (err) {
          req.flash('error_msg', 'Lỗi khi tải danh sách cấu hình AI');
          return res.redirect('/reminders');
        }
        
        // Load all recipients for selection
        Recipient.getAll((err, recipients) => {
          if (err) {
            req.flash('error_msg', 'Lỗi khi tải danh sách người nhận');
            return res.redirect('/reminders');
          }
          
          // Không cần lấy danh sách người nhận đã chọn nữa vì đã có recipient_id
          res.render('reminders/edit', {
            reminder,
            aiConfigs,
            recipients,
            title: 'Chỉnh sửa nhắc nhở'
          });
        });
      });
    });
  }

  postUpdateReminder(req, res) {
    const { 
      title, 
      ai_config_id, 
      schedule_type, 
      recipients,
      is_active,
      max_sends,
      hour,
      minute,
      day,
      date
    } = req.body;
    
    // Prepare schedule data based on schedule type
    const scheduleData = {
      hour: hour || 9,
      minute: minute || 0
    };
    
    if (schedule_type === 'weekly') {
      scheduleData.day = day || 1; // Monday
    } else if (schedule_type === 'monthly') {
      scheduleData.date = date || 1; // First day of month
    }
    
    const updatedReminder = {
      title,
      ai_config_id,
      schedule_type,
      schedule_data: scheduleData,
      is_active: is_active === 'on',
      max_sends: max_sends || 0,
      recipients: Array.isArray(recipients) ? recipients : [recipients].filter(Boolean)
    };
    
    Reminder.update(req.params.id, updatedReminder, (err) => {
      if (err) {
        req.flash('error_msg', 'Lỗi khi cập nhật nhắc nhở');
        return res.redirect(`/reminders/edit/${req.params.id}`);
      }
      
      req.flash('success_msg', 'Đã cập nhật nhắc nhở thành công');
      
      // Kiểm tra xem phương thức nào tồn tại và sử dụng nó
      // Tạm thời bỏ qua refresh scheduler
      // schedulerService.refreshSchedules();
      
      res.redirect('/reminders');
    });
  }

  deleteReminder(req, res) {
    const id = req.params.id;
    
    Reminder.delete(id, (err) => {
      if (err) {
        console.error('Lỗi khi xóa nhắc nhở:', err);
        req.flash('error_msg', 'Không thể xóa nhắc nhở. Vui lòng thử lại.');
      } else {
        req.flash('success_msg', 'Đã xóa nhắc nhở thành công');
      }
      res.redirect('/reminders');
    });
  }

  postDeleteReminder(req, res) {
    // Chuyển hướng đến phương thức deleteReminder
    this.deleteReminder(req, res);
  }

  getHistory(req, res) {
    EmailHistory.getAll((err, history) => {
      if (err) {
        req.flash('error_msg', 'Lỗi khi tải lịch sử email');
        return res.redirect('/dashboard');
      }
      
      res.render('reminders/history', {
        history,
        title: 'Lịch sử gửi email'
      });
    });
  }

  getReminderHistory(req, res) {
    Reminder.getById(req.params.id, (err, reminder) => {
      if (err || !reminder) {
        req.flash('error_msg', 'Không tìm thấy nhắc nhở');
        return res.redirect('/reminders');
      }
      
      EmailHistory.getByReminderId(req.params.id, (err, history) => {
        if (err) {
          req.flash('error_msg', 'Lỗi khi tải lịch sử email');
          return res.redirect('/reminders');
        }
        
        res.render('reminders/reminder-history', {
          reminder,
          history,
          title: `Lịch sử gửi email - ${reminder.title}`
        });
      });
    });
  }

  triggerReminder(req, res) {
    console.log('Đang gửi email cho reminder ID:', req.params.id);
    
    // Debug để kiểm tra cấu trúc bảng
    db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='reminder_recipients'", (err, result) => {
      if (err) {
        console.error('Lỗi khi kiểm tra bảng reminder_recipients:', err);
      } else {
        console.log('Cấu trúc bảng reminder_recipients:', result ? result.sql : 'Bảng không tồn tại');
      }
      
      // Kiểm tra thông tin người nhận
      db.get("SELECT recipient_id FROM reminders WHERE id = ?", [req.params.id], (err, reminder) => {
        if (err) {
          console.error('Lỗi khi kiểm tra thông tin người nhận:', err);
        } else {
          console.log('Thông tin người nhận của reminder này:', reminder);
        }
      });
    });
    
    schedulerService.triggerReminderNow(req.params.id)
      .then(results => {
        req.flash('success_msg', `Đã gửi email tới ${results.successful} người nhận thành công. (Thất bại: ${results.failed})`);
        res.redirect('/reminders');
      })
      .catch(err => {
        req.flash('error_msg', 'Lỗi khi gửi email: ' + err.message);
        res.redirect('/reminders');
      });
  }

  postEditReminder(req, res) {
    const id = req.params.id;
    const { title, recipient_id, ai_config_id, content, schedule_type,
            hour, minute, day, date } = req.body;
    
    // Xử lý active riêng vì có thể là mảng
    let active = req.body.active;
    
    console.log('-------------------------------------');
    console.log('FULL request body:', req.body); 
    console.log('Raw active value from request:', req.body.active);
    console.log('Type of active value:', typeof req.body.active);
    console.log('-------------------------------------');
    
    // Add this debugging code at the beginning of postEditReminder
    console.log('All form fields:', req.body);
    console.log('Active field value(s):', req.body.active);

    // If active field appears as an array (which might happen with two fields of same name)
    if (Array.isArray(req.body.active)) {
      console.log('Active is an array!', req.body.active);
      // Take the last value as it would override previous ones
      active = req.body.active[req.body.active.length - 1];
    } else {
      // Đã được gán ở trên
    }

    console.log('Final active value:', active);
    
    // Tạo cú pháp cron từ dữ liệu đã chọn
    let schedule;
    const hourValue = parseInt(hour) || 9;
    const minuteValue = parseInt(minute) || 0;
    
    switch(schedule_type) {
      case 'daily':
        schedule = `${minuteValue} ${hourValue} * * *`;
        break;
      case 'weekly':
        const dayValue = parseInt(day) || 1;
        schedule = `${minuteValue} ${hourValue} * * ${dayValue}`;
        break;
      case 'monthly':
        const dateValue = parseInt(date) || 1;
        schedule = `${minuteValue} ${hourValue} ${dateValue} * *`;
        break;
      default:
        schedule = `${minuteValue} ${hourValue} * * *`;
    }
    
    const updatedReminder = {
      title,
      recipient_id: recipient_id ? parseInt(recipient_id) : null,
      ai_config_id: ai_config_id ? parseInt(ai_config_id) : null,
      content,
      schedule,
      schedule_type,
      schedule_data: {
        hour: hourValue,
        minute: minuteValue,
        day: parseInt(day) || 1,
        date: parseInt(date) || 1
      },
      active: req.body.active === '1' ? 1 : 0
    };
    
    console.log('Dữ liệu sẽ cập nhật:', updatedReminder);
    console.log('Giá trị active từ form:', active, 'Chuyển đổi thành:', updatedReminder.active);
    
    Reminder.update(id, updatedReminder, (err) => {
      if (err) {
        console.error('Lỗi khi cập nhật nhắc nhở:', err);
        req.flash('error_msg', 'Lỗi khi cập nhật nhắc nhở');
        return res.redirect(`/reminders/edit/${id}`);
      }
      
      req.flash('success_msg', 'Đã cập nhật nhắc nhở thành công');
      
      // Kiểm tra xem phương thức nào tồn tại và sử dụng nó
      schedulerService.initScheduler();
      
      res.redirect('/reminders');
    });
  }
}

module.exports = new ReminderController(); 