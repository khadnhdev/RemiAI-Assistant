const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const emailService = require('./emailService');

class SchedulerService {
  constructor() {
    this.activeJobs = new Map();
    this.refreshSchedules = this.refreshSchedules.bind(this);
  }

  initScheduler() {
    // Load active reminders from database
    Reminder.getActiveReminders((err, reminders) => {
      if (err) {
        console.error('Failed to load active reminders:', err);
        return;
      }
      
      // Clear any existing jobs first
      for (const [id, job] of this.activeJobs.entries()) {
        job.stop();
        this.activeJobs.delete(id);
      }
      
      // Schedule all reminders
      reminders.forEach(reminder => {
        this.scheduleReminder(reminder);
      });
      
      console.log(`Scheduled ${reminders.length} active reminders.`);
    });
    
    // Also set up a job to refresh schedules every hour
    cron.schedule('0 * * * *', () => {
      this.refreshSchedules();
    });
  }

  refreshSchedules() {
    // Hủy các job hiện tại
    for (const [id, job] of this.activeJobs.entries()) {
      job.stop();
      this.activeJobs.delete(id);
    }
    
    // Load active reminders from database
    Reminder.getActiveReminders((err, reminders) => {
      if (err) {
        console.error('Failed to load active reminders:', err);
        return;
      }
      
      // Schedule all reminders
      reminders.forEach(reminder => {
        this.scheduleReminder(reminder);
      });
      
      console.log(`Scheduled ${reminders.length} active reminders.`);
    });
    console.log('Đã làm mới lịch trình gửi email');
  }

  scheduleReminder(reminder) {
    try {
      const scheduleData = JSON.parse(reminder.schedule_data);
      let cronExpression;
      
      switch (reminder.schedule_type) {
        case 'continuous':
          // For immediate testing, use a short interval (every minute)
          cronExpression = '* * * * *';
          break;
          
        case 'daily':
          // Run at specific time every day
          cronExpression = `${scheduleData.minute || 0} ${scheduleData.hour || 9} * * *`;
          break;
          
        case 'weekdays':
          // Run at specific time on weekdays (Monday-Friday)
          cronExpression = `${scheduleData.minute || 0} ${scheduleData.hour || 9} * * 1-5`;
          break;
          
        case 'weekly':
          // Run once a week on specific day and time
          cronExpression = `${scheduleData.minute || 0} ${scheduleData.hour || 9} * * ${scheduleData.day || 1}`;
          break;
          
        case 'monthly':
          // Run once a month on specific date and time
          cronExpression = `${scheduleData.minute || 0} ${scheduleData.hour || 9} ${scheduleData.date || 1} * *`;
          break;
          
        default:
          console.error(`Unknown schedule type: ${reminder.schedule_type}`);
          return;
      }
      
      const job = cron.schedule(cronExpression, () => {
        this.executeReminder(reminder.id);
      });
      
      this.activeJobs.set(reminder.id, job);
      console.log(`Scheduled reminder ${reminder.id} (${reminder.title}) with cron: ${cronExpression}`);
    } catch (error) {
      console.error(`Failed to schedule reminder ${reminder.id}:`, error);
    }
  }

  executeReminder(reminderId) {
    emailService.sendReminderEmails(reminderId)
      .then(results => {
        console.log(`Reminder ${reminderId} executed. Results:`, results);
        
        // Check if this reminder has reached its maximum sends
        Reminder.getById(reminderId, (err, reminder) => {
          if (err || !reminder) {
            return console.error(`Failed to get reminder ${reminderId}:`, err);
          }
          
          // Comment lại phần này nếu cột không tồn tại hoặc sử dụng điều kiện khác
          /* if (reminder.max_sends > 0 && reminder.send_count >= reminder.max_sends) {
            // Stop the job if it has reached its max sends
            const job = this.activeJobs.get(reminderId);
            if (job) {
              job.stop();
              this.activeJobs.delete(reminderId);
              console.log(`Reminder ${reminderId} has reached its maximum sends. Stopped.`);
            }
          } */
        });
      })
      .catch(error => {
        console.error(`Failed to execute reminder ${reminderId}:`, error);
      });
  }

  // Method to manually trigger a reminder
  triggerReminderNow(reminderId) {
    return emailService.sendDirectEmail(reminderId);
  }
}

const schedulerService = new SchedulerService();
module.exports = schedulerService; 