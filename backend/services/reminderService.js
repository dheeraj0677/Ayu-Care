const Appointment = require('../models/Appointment');
const notificationService = require('./notificationService');
const emailService = require('./emailService');
const { formatDate } = require('../utils/helpers');

class ReminderService {
  async checkUpcomingAppointments() {
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);

      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const upcomingAppointments = await Appointment.find({
        date: { $gte: todayStart, $lte: tomorrow },
        status: { $in: ['pending', 'confirmed'] },
      })
        .populate('patient', 'name email')
        .populate({
          path: 'doctor',
          populate: { path: 'userId', select: 'name' },
        });

      for (const appointment of upcomingAppointments) {
        const appointmentDetails = {
          doctorName: appointment.doctor?.userId?.name || 'Doctor',
          date: formatDate(appointment.date),
          time: appointment.timeSlot.startTime,
        };

        await notificationService.createReminderNotification(
          appointment.patient._id,
          appointmentDetails
        );

        await emailService.sendAppointmentReminder(
          appointment.patient.email,
          appointmentDetails
        );
      }

      console.log(`Processed ${upcomingAppointments.length} appointment reminders.`);
      return upcomingAppointments.length;
    } catch (err) {
      console.error('Reminder service error:', err.message);
      return 0;
    }
  }

  async checkOverdueAppointments() {
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const result = await Appointment.updateMany(
        {
          date: { $lt: now },
          status: 'pending',
        },
        {
          status: 'no-show',
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`Marked ${result.modifiedCount} overdue appointments as no-show.`);
      }
      return result.modifiedCount;
    } catch (err) {
      console.error('Overdue check error:', err.message);
      return 0;
    }
  }

  startScheduler(intervalMinutes = 60) {
    console.log(`Reminder scheduler started (interval: ${intervalMinutes} minutes).`);
    setInterval(async () => {
      await this.checkUpcomingAppointments();
      await this.checkOverdueAppointments();
    }, intervalMinutes * 60 * 1000);
  }
}

module.exports = new ReminderService();
