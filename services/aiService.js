const { GoogleGenerativeAI } = require("@google/generative-ai");
const AIConfig = require('../models/AIConfig');
const axios = require('axios');

// Khởi tạo Gemini API với API key từ biến môi trường
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class AIService {
  async generateEmail(aiConfigId, recipientData) {
    return new Promise((resolve, reject) => {
      AIConfig.getById(aiConfigId, async (err, aiConfig) => {
        if (err) {
          return reject(err);
        }
        
        if (!aiConfig) {
          return reject(new Error('AI configuration not found'));
        }
        
        try {
          // Tạo system prompt với các biến được thay thế
          let systemPrompt = aiConfig.system_prompt || '';
          systemPrompt = systemPrompt
            .replace('{language}', aiConfig.language || 'Vietnamese')
            .replace('{tone}', aiConfig.tone || 'Professional')
            .replace('{length}', aiConfig.length || 'Medium')
            .replace('{style}', aiConfig.style || 'Formal');
          
          // Thay thế placeholders trong template prompt với dữ liệu người nhận
          let promptText = aiConfig.prompt_template;
          
          // Thay thế các thuộc tính cơ bản của người nhận
          promptText = promptText.replace(/\{name\}/g, recipientData.name || '');
          promptText = promptText.replace(/\{email\}/g, recipientData.email || '');
          
          // Thay thế các thuộc tính tùy chỉnh nếu có
          const customAttributes = recipientData.custom_attributes ? 
            JSON.parse(recipientData.custom_attributes) : {};
          
          Object.keys(customAttributes).forEach(key => {
            promptText = promptText.replace(
              new RegExp(`\\{${key}\\}`, 'g'), 
              customAttributes[key] || ''
            );
          });
          
          // Tạo hướng dẫn system message với tone và ngôn ngữ
          const systemInstruction = `Bạn là Remin AI, một trợ lý viết reminder email bằng ${aiConfig.language || 'tiếng Việt'} 
            với giọng điệu ${aiConfig.tone || 'chuyên nghiệp'}. 
            Hãy tạo một email nội dung email, không có tiêu đề. chỉ trả về nội dung email đầy đủ và chuyên nghiệp và không nói gì thêm.
            Đầy đủ email phải giới thiệu đây là email tự động (tùy theo ngôn ngữ của người nhận), chữ ký là của bạn. nội dung mail có format đẹp, chuyên nghiệp, có chào người nhận.
            
            Nội dung email: ${systemPrompt}
            `;
          
          // Chọn model Gemini dựa trên cấu hình (mặc định lấy từ biến môi trường)
          const modelName = process.env.DEFAULT_AI_MODEL || 'gemini-2.0-flash';
          const model = genAI.getGenerativeModel({ model: modelName });
          
          // Tạo và gửi prompt đến Gemini API với system prompt
          const chat = model.startChat({
            history: [
              {
                role: "user",
                parts: [{ text: systemInstruction }],
              }
            ],
          });
          
          const result = await chat.sendMessage(promptText);
          const content = result.response.text();
          
          // Đảm bảo nội dung email có container chính nếu chưa có
          let body = content;
          if (!body.includes('email-container')) {
            body = `<div class="email-container" style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; color: #34495e; line-height: 1.6;">
              ${body}
            </div>`;
          }
          
          // Thêm CSS cơ bản nếu chưa có style
          if (!body.includes('style=')) {
            const defaultStyles = {
              'email-header': 'margin-bottom: 20px;',
              'email-body': 'margin-bottom: 30px;',
              'email-footer': 'margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;',
              'signature': 'margin-top: 20px; color: #666;'
            };
            
            Object.entries(defaultStyles).forEach(([className, style]) => {
              const regex = new RegExp(`<div class="${className}"`, 'g');
              body = body.replace(regex, `<div class="${className}" style="${style}"`);
            });
          }
          
          // Đảm bảo các thẻ p có style cơ bản
          body = body.replace(/<p>/g, '<p style="margin: 0 0 15px 0;">');
          
          // Đảm bảo links có style đẹp
          body = body.replace(/<a /g, '<a style="color: #3498db; text-decoration: none;" ');
          
          // Thêm meta tags để đảm bảo encoding và responsive
          body = `
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            ${body}
          `;
          
          // Phân tích chủ đề từ nội dung
          let subject = '';
          
          // Cố gắng trích xuất dòng tiêu đề
          const subjectMatch = content.match(/Subject:(.+?)(\n|$)/i) || content.match(/Tiêu đề:(.+?)(\n|$)/i);
          if (subjectMatch) {
            subject = subjectMatch[1].trim();
          } else {
            // Sử dụng dòng đầu tiên làm tiêu đề nếu không được định nghĩa rõ ràng
            const lines = content.split('\n');
            subject = lines[0].trim();
          }
          
          resolve({
            subject,
            body
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async generateContent(reminder) {
    try {
      // Lấy thông tin người nhận
      const recipient = {
        name: reminder.recipient_name,
        email: reminder.recipient_email
      };
      
      // Log chi tiết hơn để debug
      console.log('Đang tạo nội dung email với Gemini cho:', reminder.title);
      console.log('AI Config ID:', reminder.ai_config_id);
      console.log('Người nhận:', JSON.stringify(recipient));
      
      // Kiểm tra xem AI Config có tồn tại
      if (!reminder.ai_config_id) {
        throw new Error('Không có AI Config ID cho nhắc nhở này');
      }
      
      // Sử dụng phương thức hiện có
      const emailContent = await this.generateEmail(
        reminder.ai_config_id,
        recipient
      );
      
      console.log('Đã tạo xong nội dung email với Gemini');
      // Log một phần nội dung để kiểm tra
      console.log('Nội dung email (100 ký tự đầu):', 
        emailContent.body.substring(0, 100) + '...');
      
      // Trả về nội dung email
      return emailContent.body;
    } catch (error) {
      console.error('Lỗi khi tạo nội dung email:', error);
      console.error('Chi tiết lỗi:', error.stack);
      
      // Thông báo chi tiết hơn về lỗi để dễ debug
      let errorMessage = 'Không thể tạo nội dung email. ';
      if (error.message) {
        errorMessage += 'Lỗi: ' + error.message;
      }
      
      return errorMessage;
    }
  }
}

// Export một instance của lớp thay vì export cả lớp
module.exports = new AIService(); 