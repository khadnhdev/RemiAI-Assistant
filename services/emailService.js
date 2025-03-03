const nodemailer = require('nodemailer');
const EmailHistory = require('../models/EmailHistory');
const Reminder = require('../models/Reminder');
const aiService = require('./aiService');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  async sendReminderEmails(reminderId) {
    return new Promise((resolve, reject) => {
      Reminder.getById(reminderId, async (err, reminder) => {
        if (err) {
          return reject(err);
        }
        
        if (!reminder) {
          return reject(new Error('Reminder not found'));
        }
        
        Reminder.getRecipientsByReminderId(reminderId, async (err, recipients) => {
          if (err) {
            return reject(err);
          }
          
          const results = {
            total: recipients.length,
            successful: 0,
            failed: 0,
            details: []
          };
          
          for (const recipient of recipients) {
            try {
              // Generate email content using AI
              const emailContent = await aiService.generateEmail(
                reminder.ai_config_id,
                recipient
              );
              
              // Send the email
              await this.sendEmail(
                recipient.email,
                emailContent.subject,
                emailContent.body
              );
              
              // Record in history
              await new Promise((resolveHistory, rejectHistory) => {
                EmailHistory.create({
                  reminder_id: reminderId,
                  recipient_id: recipient.id,
                  subject: emailContent.subject,
                  content: emailContent.body,
                  status: 'sent'
                }, (err) => {
                  if (err) {
                    rejectHistory(err);
                  } else {
                    resolveHistory();
                  }
                });
              });
              
              results.successful++;
              results.details.push({
                recipient: recipient.email,
                status: 'success'
              });
            } catch (error) {
              // Record failed attempt in history
              await new Promise((resolveHistory) => {
                EmailHistory.create({
                  reminder_id: reminderId,
                  recipient_id: recipient.id,
                  subject: 'Email generation failed',
                  content: error.message,
                  status: 'failed'
                }, () => resolveHistory());
              });
              
              results.failed++;
              results.details.push({
                recipient: recipient.email,
                status: 'failed',
                error: error.message
              });
            }
          }
          
          // Increment the send count
          Reminder.incrementSendCount(reminderId, (err) => {
            if (err) {
              console.error('Failed to increment send count:', err);
            }
            resolve(results);
          });
        });
      });
    });
  }

  async sendEmail(to, subject, content) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: content
    };
    
    return this.transporter.sendMail(mailOptions);
  }
}

module.exports = new EmailService(); 