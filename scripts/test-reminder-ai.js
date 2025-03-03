require('dotenv').config();
const aiService = require('../services/aiService');
const db = require('../config/database');

// Kiểm tra cụ thể hơn cho nhắc nhở với ID nhất định
const testReminderId = 4; // Thay đổi ID nhắc nhở tùy theo cần test

console.log(`Kiểm tra tạo nội dung AI cho nhắc nhở ID ${testReminderId}...`);

// Truy vấn thông tin nhắc nhở từ DB
const sql = `
  SELECT r.*, rec.name as recipient_name, rec.email as recipient_email,
         a.name as ai_config_name, a.prompt_template
  FROM reminders r
  LEFT JOIN recipients rec ON r.recipient_id = rec.id
  LEFT JOIN ai_configs a ON r.ai_config_id = a.id
  WHERE r.id = ?
`;

db.get(sql, [testReminderId], async (err, reminder) => {
  if (err) {
    console.error('Lỗi khi truy vấn DB:', err);
    process.exit(1);
  }
  
  if (!reminder) {
    console.error(`Không tìm thấy nhắc nhở với ID ${testReminderId}`);
    process.exit(1);
  }
  
  console.log('Thông tin nhắc nhở:');
  console.log('- Tiêu đề:', reminder.title);
  console.log('- Người nhận:', reminder.recipient_name, `(${reminder.recipient_email})`);
  console.log('- AI Config:', reminder.ai_config_name, `(ID: ${reminder.ai_config_id})`);
  
  if (!reminder.ai_config_id) {
    console.error('Nhắc nhở này không có AI Config ID!');
    process.exit(1);
  }
  
  if (!reminder.prompt_template) {
    console.log('CẢNH BÁO: Không tìm thấy prompt template trong kết quả truy vấn');
    
    // Truy vấn thêm thông tin AI config
    db.get('SELECT * FROM ai_configs WHERE id = ?', [reminder.ai_config_id], (err, aiConfig) => {
      if (err || !aiConfig) {
        console.error('Không thể lấy thông tin AI config:', err);
        process.exit(1);
      }
      
      console.log('Thông tin AI Config:');
      console.log(aiConfig);
      testGenerateContent(reminder);
    });
  } else {
    testGenerateContent(reminder);
  }
});

async function testGenerateContent(reminder) {
  try {
    console.log('\nĐang gọi aiService.generateContent...');
    const content = await aiService.generateContent(reminder);
    
    console.log('\nKết quả tạo nội dung thành công:');
    console.log('-'.repeat(50));
    console.log(content);
    console.log('-'.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('\nLỗi khi gọi aiService.generateContent:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
} 