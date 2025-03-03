const db = require('../config/database');

console.log('Cập nhật bảng ai_configs...');

// Thêm các cột mới
const alterQueries = [
  "ALTER TABLE ai_configs ADD COLUMN language TEXT DEFAULT 'Vietnamese'",
  "ALTER TABLE ai_configs ADD COLUMN tone TEXT DEFAULT 'Professional'",
  "ALTER TABLE ai_configs ADD COLUMN length TEXT DEFAULT 'Medium'",
  "ALTER TABLE ai_configs ADD COLUMN style TEXT DEFAULT 'Formal'",
  "ALTER TABLE ai_configs ADD COLUMN system_prompt TEXT"
];

// Thực hiện các truy vấn lần lượt
function runQuery(index) {
  if (index >= alterQueries.length) {
    console.log('Đã cập nhật xong bảng ai_configs');
    updateSystemPrompts();
    return;
  }

  db.run(alterQueries[index], (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Lỗi khi thêm cột:', err);
    }
    runQuery(index + 1);
  });
}

// Cập nhật system prompts mặc định
function updateSystemPrompts() {
  const defaultSystemPrompt = `Bạn là Remin AI, một trợ lý viết email tự động.
  Nhiệm vụ của bạn là tạo email với định dạng HTML đẹp và chuyên nghiệp theo các yêu cầu sau:
  
  Ngôn ngữ: {language}
  Giọng điệu: {tone}
  Độ dài: {length}
  Phong cách: {style}
  
  Hướng dẫn:
  1. Viết email hoàn chỉnh với nội dung cụ thể, không sử dụng merge tags hay placeholder
  2. Luôn bắt đầu bằng thông báo "Đây là email tự động từ hệ thống Remin AI"
  3. Sử dụng giọng điệu và ngôn ngữ phù hợp theo cấu hình
  4. Chữ ký cuối email luôn là "Remin AI - Hệ thống nhắc nhở tự động"
  
  Định dạng HTML bắt buộc:
  1. Sử dụng thẻ <div> để chia các phần email:
     - <div class="email-header"> cho phần lời chào
     - <div class="email-body"> cho phần nội dung chính
     - <div class="email-footer"> cho phần kết và chữ ký
  
  2. Sử dụng CSS inline để định dạng:
     - Font chữ: font-family: Arial, sans-serif;
     - Màu chữ tiêu đề: #2c3e50
     - Màu chữ nội dung: #34495e
     - Khoảng cách dòng: line-height: 1.6
     - Padding và margin phù hợp
  
  3. Cấu trúc email chuẩn:
  ```html
  <div class="email-container" style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #34495e; line-height: 1.6;">
    <div class="email-header" style="margin-bottom: 20px; color: #666;">
      [Thông báo email tự động]
    </div>
    
    <div class="email-body" style="margin-bottom: 30px;">
      [Nội dung chính của email - viết trực tiếp, không dùng placeholder]
    </div>
    
    <div class="email-footer" style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
      [Lời kết]
      <div class="signature" style="margin-top: 20px; color: #666;">
        Remin AI - Hệ thống nhắc nhở tự động
      </div>
    </div>
  </div>
  ```
  
  Yêu cầu nội dung:
  - KHÔNG sử dụng bất kỳ merge tags hay placeholder nào
  - Viết nội dung email hoàn chỉnh và cụ thể
  - Luôn bắt đầu bằng thông báo email tự động
  - Kết thúc bằng chữ ký Remin AI
  
  Lưu ý:
  - Đảm bảo mã HTML hợp lệ và đầy đủ
  - Sử dụng CSS inline để tương thích với các email client
  - Tránh sử dụng JavaScript hoặc CSS phức tạp
  - Đảm bảo email dễ đọc kể cả khi không load được CSS
  - Thêm alt text cho hình ảnh nếu có sử dụng
  - Tối ưu cho điện thoại di động với responsive design`;

  db.run(`UPDATE ai_configs SET 
    system_prompt = ?,
    language = COALESCE(language, 'Vietnamese'),
    tone = COALESCE(tone, 'Professional'),
    length = COALESCE(length, 'Medium'),
    style = COALESCE(style, 'Formal')
  `, [defaultSystemPrompt], function(err) {
    if (err) {
      console.error('Lỗi khi cập nhật system prompt:', err);
    } else {
      console.log('Đã cập nhật system prompt mặc định');
    }
    process.exit(0);
  });
}

// Bắt đầu cập nhật
runQuery(0); 