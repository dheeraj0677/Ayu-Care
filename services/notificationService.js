const Notification = require('../models/Notification');

class NotificationService {
  async create(userId, { title, message, type = 'system', link = '', icon = 'bell', priority = 'medium' }) {
    try {
      const notification = await Notification.create({
        user: userId,
        title,
        message,
        type,
        link,
        icon,
        priority,
      });
      return notification;
    } catch (err) {
      console.error('Notification creation failed:', err.message);
      return null;
    }
  }

  async createAppointmentNotification(userId, appointmentDetails) {
    const { appointmentId, doctorName, date, time, status } = appointmentDetails;
    const statusMessages = {
      pending: `Your appointment ${appointmentId} with ${doctorName} on ${date} at ${time} is pending confirmation.`,
      confirmed: `Your appointment ${appointmentId} with ${doctorName} on ${date} at ${time} has been confirmed!`,
      cancelled: `Your appointment ${appointmentId} with ${doctorName} has been cancelled.`,
      completed: `Your appointment ${appointmentId} with ${doctorName} has been completed. Please leave a review!`,
    };

    return this.create(userId, {
      title: `Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: statusMessages[status] || `Appointment ${appointmentId} status updated to ${status}.`,
      type: 'appointment',
      link: `/dashboard.html`,
      icon: 'calendar',
      priority: status === 'cancelled' ? 'high' : 'medium',
    });
  }

  async createPrescriptionNotification(userId, doctorName) {
    return this.create(userId, {
      title: 'Prescription Renewed',
      message: `Dr. ${doctorName} has issued a new prescription for you.`,
      type: 'prescription',
      link: '/prescriptions.html',
      icon: 'prescription',
      priority: 'medium',
    });
  }

  async createLabResultNotification(userId, reportName) {
    return this.create(userId, {
      title: 'Lab Results Ready',
      message: `Your ${reportName} report is now available for download.`,
      type: 'lab-result',
      link: '/health-records.html',
      icon: 'lab',
      priority: 'high',
    });
  }

  async createFeedbackNotification(userId, doctorName) {
    return this.create(userId, {
      title: 'Feedback Request',
      message: `How was your visit with ${doctorName}? Let us know!`,
      type: 'feedback',
      link: '/dashboard.html',
      icon: 'star',
      priority: 'low',
    });
  }

  async createReminderNotification(userId, appointmentDetails) {
    const { doctorName, date, time } = appointmentDetails;
    return this.create(userId, {
      title: 'Appointment Reminder',
      message: `Reminder: Your appointment with ${doctorName} is scheduled for ${date} at ${time}.`,
      type: 'reminder',
      link: '/dashboard.html',
      icon: 'clock',
      priority: 'high',
    });
  }

  async getUnreadCount(userId) {
    return Notification.countDocuments({ user: userId, isRead: false });
  }

  async markAsRead(notificationId) {
    return Notification.findByIdAndUpdate(notificationId, { isRead: true }, { new: true });
  }

  async markAllAsRead(userId) {
    return Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
  }

  async getBrowserNotificationPayload(notification) {
    return {
      title: notification.title,
      body: notification.message,
      icon: '/client/assets/icons/ayucare-icon.svg',
      tag: notification._id.toString(),
      data: {
        url: notification.link,
        type: notification.type,
      },
    };
  }
}

module.exports = new NotificationService();
