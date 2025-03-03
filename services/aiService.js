const { GoogleGenerativeAI } = require("@google/generative-ai");
const AIConfig = require('../models/AIConfig');

// Khởi tạo Gemini API với API key từ biến môi trường
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class AIService {
  static async generateEmail(aiConfigId, recipientData) {
    return new Promise((resolve, reject) => {
      AIConfig.getById(aiConfigId, async (err, aiConfig) => {
        if (err) {
          return reject(err);
        }
        
        if (!aiConfig) {
          return reject(new Error('AI configuration not found'));
        }
        
        try {
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
          const systemInstruction = `Bạn là một trợ lý viết email bằng ${aiConfig.language || 'tiếng Việt'} 
            với giọng điệu ${aiConfig.tone || 'chuyên nghiệp'}. 
            Hãy tạo một email bao gồm dòng tiêu đề và nội dung email.`;
          
          // Chọn model Gemini dựa trên cấu hình (mặc định lấy từ biến môi trường)
          const modelName = process.env.DEFAULT_AI_MODEL || 'gemini-2.0-flash';
          const model = genAI.getGenerativeModel({ model: modelName });
          
          // Tạo và gửi prompt đến Gemini API với các cấu hình đầy đủ
          const chat = model.startChat({
            generationConfig: {
              temperature: parseFloat(aiConfig.temperature) || 0.7,
              topP: parseFloat(aiConfig.top_p) || 0.95,
              topK: parseInt(aiConfig.top_k) || 40,
              maxOutputTokens: parseInt(aiConfig.max_output_tokens) || 1024,
            },
            history: [
              {
                role: "user",
                parts: [{ text: systemInstruction }],
              },
              {
                role: "model",
                parts: [{ text: "Tôi sẽ giúp bạn viết email với giọng điệu và ngôn ngữ như yêu cầu." }],
              },
            ],
          });
          
          const result = await chat.sendMessage(promptText);
          const content = result.response.text();
          
          // Phân tích chủ đề từ nội dung
          let subject = '';
          let body = content;
          
          // Cố gắng trích xuất dòng tiêu đề
          const subjectMatch = content.match(/Subject:(.+?)(\n|$)/i) || content.match(/Tiêu đề:(.+?)(\n|$)/i);
          if (subjectMatch) {
            subject = subjectMatch[1].trim();
            body = content.replace(/Subject:(.+?)(\n|$)/i, '').replace(/Tiêu đề:(.+?)(\n|$)/i, '').trim();
          } else {
            // Sử dụng dòng đầu tiên làm tiêu đề nếu không được định nghĩa rõ ràng
            const lines = content.split('\n');
            subject = lines[0].trim();
            body = lines.slice(1).join('\n').trim();
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

  async generateContent(aiConfigId, recipient, content) {
    try {
      const aiConfig = await this.getAIConfig(aiConfigId);
      if (!aiConfig) {
        throw new Error('Không tìm thấy cấu hình AI');
      }
      
      const modelName = process.env.DEFAULT_AI_MODEL || 'gemini-2.0-flash';
      
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('Thiếu API key cho Gemini');
      }
    } catch (error) {
      throw error;
    }
  }
}

module.exports = AIService; 