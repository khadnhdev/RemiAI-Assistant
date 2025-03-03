const express = require('express');
const router = express.Router();
const recipientController = require('../controllers/recipientController');
const { isAuthenticated } = require(require('path').join(__dirname, '..', 'middleware', 'auth'));
const { body, validationResult } = require('express-validator');

// Middleware áp dụng cho tất cả các route
// Tạm thời bỏ xác thực để debug
// router.use(isAuthenticated);

// Middleware validate
const validateRecipient = [
  body('name').notEmpty().withMessage('Tên là bắt buộc'),
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('custom_attributes')
    .optional({ nullable: true, checkFalsy: true })
    .custom(value => {
      if (!value) return true;
      try {
        const parsed = JSON.parse(value);
        return typeof parsed === 'object' && parsed !== null;
      } catch (e) {
        throw new Error('Không phải là JSON hợp lệ');
      }
    }),
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
    return res.redirect('/recipients/create');
  }
  next();
};

// Main list
router.get('/', recipientController.getRecipients);

// Create
router.get('/create', recipientController.getCreateRecipient);
router.post('/create', validateRecipient, handleValidationErrors, recipientController.postCreateRecipient);

// Edit
router.get('/edit/:id', recipientController.getEditRecipient);
router.post('/edit/:id', validateRecipient, handleValidationErrors, recipientController.postUpdateRecipient);

// Delete
router.delete('/:id', recipientController.postDeleteRecipient);
router.post('/delete/:id', recipientController.postDeleteRecipient);

module.exports = router; 