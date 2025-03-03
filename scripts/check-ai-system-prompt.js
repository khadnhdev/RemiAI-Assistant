const db = require('../config/database');

console.log('Kiểm tra cấu hình AI...');

db.all("SELECT * FROM ai_configs", [], (err, configs) => {
  if (err) {
    console.error('Lỗi khi truy vấn:', err);
    process.exit(1);
  }

  console.log(`\nTìm thấy ${configs.length} cấu hình AI:`);
  configs.forEach(config => {
    console.log('\n' + '-'.repeat(50));
    console.log('ID:', config.id);
    console.log('Tên:', config.name);
    console.log('Ngôn ngữ:', config.language);
    console.log('Giọng điệu:', config.tone);
    console.log('Độ dài:', config.length);
    console.log('Phong cách:', config.style);
    console.log('\nSystem Prompt:');
    console.log(config.system_prompt || 'Chưa có');
    console.log('\nPrompt Template:');
    console.log(config.prompt_template || 'Chưa có');
  });

  process.exit(0);
}); 