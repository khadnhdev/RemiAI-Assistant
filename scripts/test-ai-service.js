const aiService = require('../services/aiService');

console.log('Kiểm tra dịch vụ AI...');
console.log('Các phương thức có sẵn:', Object.keys(aiService));

// Thử gọi phương thức generateEmail
console.log('Thử gọi generateEmail...');
aiService.generateEmail(1, { name: 'Test User', email: 'test@example.com' })
  .then(result => {
    console.log('Kết quả generateEmail:', result);
  })
  .catch(err => {
    console.error('Lỗi generateEmail:', err);
  });

// Kiểm tra xem có phương thức generateContent hay không
if (typeof aiService.generateContent === 'function') {
  console.log('generateContent tồn tại, thử gọi nó...');
  aiService.generateContent({
    id: 1, 
    title: 'Test Reminder',
    recipient_name: 'Test User',
    recipient_email: 'test@example.com',
    ai_config_id: 1
  })
    .then(result => {
      console.log('Kết quả generateContent:', result);
    })
    .catch(err => {
      console.error('Lỗi generateContent:', err);
    });
} else {
  console.log('generateContent không tồn tại!');
} 