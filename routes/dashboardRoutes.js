const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const db = require('../config/database');

// Sử dụng middleware xác thực cho tất cả các route trong dashboard
router.use(isAuthenticated);

// Trang dashboard
router.get('/', (req, res) => {
  // Truy vấn tổng số lượng
  db.get(
    `SELECT
      (SELECT COUNT(*) FROM recipients) AS totalRecipients,
      (SELECT COUNT(*) FROM ai_configs) AS totalAiConfigs,
      (SELECT COUNT(*) FROM reminders) AS totalReminders,
      (SELECT COUNT(*) FROM email_history) AS totalEmailsSent
    `,
    (err, stats) => {
      if (err) {
        console.error('Lỗi khi truy vấn thống kê:', err);
        stats = { totalRecipients: 0, totalAiConfigs: 0, totalReminders: 0, totalEmailsSent: 0 };
      }
      
      // Truy vấn email đã gửi gần đây
      db.all(
        `SELECT eh.*, r.title as reminder_title, rcp.name as recipient_name, rcp.email as recipient_email
         FROM email_history eh
         LEFT JOIN reminders r ON eh.reminder_id = r.id
         LEFT JOIN recipients rcp ON eh.recipient_id = rcp.id
         ORDER BY eh.sent_at DESC LIMIT 5`,
        (err, recentEmails) => {
          if (err) {
            console.error('Lỗi khi truy vấn email gần đây:', err);
            recentEmails = [];
          }
          
          res.render('dashboard', {
            title: 'Bảng điều khiển',
            stats,
            recentEmails
          });
        }
      );
    }
  );
});

module.exports = router; 