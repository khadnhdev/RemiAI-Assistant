require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require('../config/database');

// Kiểm tra API key và kết nối đến Gemini
console.log('Kiểm tra kết nối đến Gemini API...');

// Kiểm tra xem API key đã được cấu hình chưa
if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY không tìm thấy trong biến môi trường!');
  process.exit(1);
}

// Khởi tạo Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Kiểm tra có thể gửi prompt đơn giản
async function testGemini() {
  try {
    console.log('Đang kiểm tra API với prompt đơn giản...');
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Chào bạn, hãy giới thiệu bản thân.");
    const response = await result.response;
    const text = response.text();
    console.log('API hoạt động! Phản hồi từ Gemini:');
    console.log('-'.repeat(50));
    console.log(text.substring(0, 200) + '...');
    console.log('-'.repeat(50));
    
    // Kiểm tra AI configs trong database
    db.all("SELECT * FROM ai_configs", [], (err, configs) => {
      if (err) {
        console.error('Lỗi khi truy vấn database:', err);
        process.exit(1);
      }
      
      console.log(`Tìm thấy ${configs.length} cấu hình AI:`);
      configs.forEach(config => {
        console.log(`- ID: ${config.id}, Tên: ${config.name}`);
        console.log(`  Prompt template: ${config.prompt_template?.substring(0, 50)}...`);
      });
      
      process.exit(0);
    });
  } catch (error) {
    console.error('Lỗi khi kiểm tra API Gemini:', error);
    process.exit(1);
  }
}

testGemini(); 