const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const { isAuthenticated } = require('../middleware/auth');
const { body, validationResult, check } = require('express-validator');

// Middleware áp dụng cho tất cả các route
router.use(isAuthenticated);

// Middleware validate
const validateReminder = [
  body('title').notEmpty().withMessage('Tiêu đề là bắt buộc'),
  body('recipient_id').notEmpty().withMessage('Người nhận là bắt buộc'),
  body('schedule')
    .notEmpty().withMessage('Lịch gửi là bắt buộc')
    .matches(/^(\d+|\*)\s+(\d+|\*)\s+(\d+|\*)\s+(\d+|\*)\s+(\d+|\*)$/)
    .withMessage('Định dạng cron không hợp lệ'),
  body('content')
    .custom((value, { req }) => {
      // Nếu không chọn cấu hình AI, phải có nội dung
      return req.body.ai_config_id || value.trim() !== '';
    })
    .withMessage('Phải nhập nội dung hoặc chọn cấu hình AI'),
];

// Middleware xử lý lỗi validate
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error_msg', errors.array()[0].msg);
    
    // Nếu đang chỉnh sửa, chuyển hướng đến trang edit
    if (req.path.includes('/edit/')) {
      return res.redirect(req.originalUrl);
    }
    
    // Nếu đang tạo mới, chuyển hướng đến trang create
    return res.redirect('/reminders/create');
  }
  next();
};

// Main list
router.get('/', reminderController.getReminders);

// History
router.get('/history', reminderController.getHistory);
router.get('/history/:id', reminderController.getReminderHistory);

// Create
router.get('/create', reminderController.getCreateReminder);
router.post('/create', validateReminder, handleValidationErrors, reminderController.postCreateReminder);

// Edit
router.get('/edit/:id', reminderController.getEditReminder);
router.post('/edit/:id', reminderController.postEditReminder);

// Delete
router.delete('/:id', reminderController.deleteReminder);
router.post('/delete/:id', reminderController.deleteReminder);

// Trigger
router.post('/trigger/:id', reminderController.triggerReminder);

module.exports = router; 