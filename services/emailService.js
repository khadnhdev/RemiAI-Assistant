const nodemailer = require('nodemailer');
const EmailHistory = require('../models/EmailHistory');
const Reminder = require('../models/Reminder');
const aiService = require('./aiService');
const Recipient = require('../models/Recipient');
const db = require('../config/database');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // Lấy email CC từ biến môi trường
    this.ccEmail = process.env.CC_EMAIL;
  }

  async sendReminderEmails(reminderId) {
    return new Promise((resolve, reject) => {
      // Get the reminder
      Reminder.getById(reminderId, (err, reminder) => {
        if (err || !reminder) {
          return reject(new Error('Reminder not found or database error'));
        }
        
        // Check if reminder has a recipient
        if (!reminder.recipient_id) {
          return reject(new Error('Không có người nhận cho nhắc nhở này'));
        }
        
        // Get the recipient
        Recipient.getById(reminder.recipient_id, (err, recipient) => {
          if (err || !recipient) {
            return reject(new Error('Không tìm thấy người nhận hoặc lỗi cơ sở dữ liệu'));
          }
          
          // Put the recipient in an array for compatibility with the rest of the function
          const recipients = [recipient];
        
          // Create a counter for successful and failed emails
          let results = {
            successful: 0,
            failed: 0
          };
          
          // Use AI content generation if configured
          let contentPromise;
          if (reminder.ai_config_id) {
            contentPromise = aiService.generateContent(reminder);
          } else {
            contentPromise = Promise.resolve(reminder.content);
          }
          
          contentPromise.then(content => {
            // Create email content
            const emailOptions = {
              subject: reminder.title,
              content: content
            };
            
            // Send the email
            this.sendEmail(recipient.email, emailOptions.subject, emailOptions.content)
              .then(() => {
                // Record in history
                EmailHistory.create({
                  reminder_id: reminderId,
                  recipient_id: recipient.id,
                  subject: emailOptions.subject,
                  content: emailOptions.content,
                  status: 'sent'
                }, (err) => {
                  if (err) {
                    console.error('Failed to record email history:', err);
                  }
                });
                
                results.successful++;
                results.details = [{
                  recipient: recipient.email,
                  status: 'success'
                }];
                resolve(results);
              })
              .catch(error => {
                // Record failed attempt in history
                EmailHistory.create({
                  reminder_id: reminderId,
                  recipient_id: recipient.id,
                  subject: 'Email generation failed',
                  content: error.message,
                  status: 'failed'
                }, () => {
                  console.error('Email generation failed:', error.message);
                  results.failed++;
                  results.details = [{
                    recipient: recipient.email,
                    status: 'failed',
                    error: error.message
                  }];
                  resolve(results);
                });
              });
          });
        });
      });
    });
  }

  async sendEmail(to, subject, content) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      cc: this.ccEmail,
      subject,
      html: content
    };
    
    // Log thông tin gửi email
    console.log('Gửi email đến:', to);
    console.log('CC đến:', this.ccEmail);
    
    return this.transporter.sendMail(mailOptions);
  }

  // Phương thức mới để gửi email ngay lập tức (skip qua phần reminder_recipients)
  sendDirectEmail(reminderId) {
    return new Promise((resolve, reject) => {
      // Get the reminder with recipient info
      const sql = `
        SELECT r.*, rec.name as recipient_name, rec.email as recipient_email,
               a.name as ai_config_name
        FROM reminders r
        LEFT JOIN recipients rec ON r.recipient_id = rec.id
        LEFT JOIN ai_configs a ON r.ai_config_id = a.id
        WHERE r.id = ?
      `;
      
      db.get(sql, [reminderId], async (err, reminder) => {
        if (err || !reminder) {
          return reject(new Error('Không tìm thấy nhắc nhở hoặc lỗi cơ sở dữ liệu'));
        }
        
        if (!reminder.recipient_email) {
          return reject(new Error('Không có email người nhận cho nhắc nhở này'));
        }
        
        try {
          // Use AI content generation if configured
          let content;
          if (reminder.ai_config_id) {
            try {
              console.log('Đang sử dụng Gemini AI để tạo nội dung email...');
              console.log('AI Config ID:', reminder.ai_config_id);
              
              // Gọi phương thức generateContent từ aiService
              content = await aiService.generateContent(reminder);
              console.log('Đã tạo nội dung email bằng AI thành công');
            } catch (aiError) {
              console.error('Lỗi khi tạo nội dung AI:', aiError);
              // Fallback nếu AI thất bại
              content = `<p>Đây là email tự động từ hệ thống nhắc nhở.</p>
                        <p><strong>Tiêu đề:</strong> ${reminder.title}</p>
                        <p><strong>Nội dung:</strong> ${reminder.content || 'Không có nội dung'}</p>
                        <p>Email này được gửi tới ${reminder.recipient_name} (${reminder.recipient_email}).</p>`;
            }
          } else {
            content = reminder.content || '';
          }
          
          // Send email
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: reminder.recipient_email,
            cc: this.ccEmail,
            subject: reminder.title,
            html: content
          };
          
          console.log('Gửi email trực tiếp đến:', reminder.recipient_email);
          console.log('CC đến:', this.ccEmail);
          
          const info = await this.transporter.sendMail(mailOptions);
          console.log('Email đã được gửi:', info.messageId);
          
          // Log lịch sử
          EmailHistory.create({
            reminder_id: reminder.id,
            recipient_id: reminder.recipient_id,
            subject: reminder.title,
            content: content || '',
            status: 'success',
            error: null
          }, (err) => {
            if (err) {
              console.error('Lỗi khi lưu lịch sử email:', err);
            }
          });
          
          resolve({ successful: 1, failed: 0 });
        } catch (error) {
          console.error('Lỗi khi gửi email:', error);
          
          // Log lịch sử thất bại
          EmailHistory.create({
            reminder_id: reminder.id,
            recipient_id: reminder.recipient_id,
            subject: reminder.title,
            content: error.message || '',
            status: 'failed',
            error: error.message || 'Unknown error'
          }, () => {});
          
          resolve({ successful: 0, failed: 1 });
        }
      });
    });
  }
}

module.exports = new EmailService(); 