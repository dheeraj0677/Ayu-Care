const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const mongoose = require('mongoose');

class AnalyticsService {
  async getAppointmentStats(filters = {}) {
    const matchStage = {};
    if (filters.startDate) matchStage.date = { $gte: new Date(filters.startDate) };
    if (filters.endDate) {
      matchStage.date = { ...matchStage.date, $lte: new Date(filters.endDate) };
    }

    const stats = await Appointment.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
        },
      },
    ]);

    const result = {
      total: 0,
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      totalRevenue: 0,
    };

    stats.forEach((item) => {
      result.total += item.count;
      result.totalRevenue += item.totalRevenue;
      switch (item._id) {
        case 'pending': result.pending = item.count; break;
        case 'confirmed': result.confirmed = item.count; break;
        case 'completed': result.completed = item.count; break;
        case 'cancelled': result.cancelled = item.count; break;
        case 'no-show': result.noShow = item.count; break;
      }
    });

    result.completionRate = result.total > 0
      ? Math.round((result.completed / result.total) * 100)
      : 0;

    return result;
  }

  async getDepartmentStats() {
    const stats = await Appointment.aggregate([
      {
        $lookup: {
          from: 'departments',
          localField: 'department',
          foreignField: '_id',
          as: 'departmentInfo',
        },
      },
      { $unwind: '$departmentInfo' },
      {
        $group: {
          _id: '$department',
          departmentName: { $first: '$departmentInfo.name' },
          totalAppointments: { $sum: 1 },
          completedAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          cancelledAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] },
          },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { totalAppointments: -1 } },
    ]);

    return stats;
  }

  async getWeeklyReport() {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const dailyStats = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: weekAgo, $lte: today },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' },
          },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const totalThisWeek = dailyStats.reduce((sum, day) => sum + day.count, 0);
    const totalCompleted = dailyStats.reduce((sum, day) => sum + day.completed, 0);
    const totalRevenue = dailyStats.reduce((sum, day) => sum + day.revenue, 0);

    return {
      period: 'weekly',
      startDate: weekAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      dailyStats,
      summary: {
        totalAppointments: totalThisWeek,
        completedAppointments: totalCompleted,
        completionRate: totalThisWeek > 0 ? Math.round((totalCompleted / totalThisWeek) * 100) : 0,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
      },
    };
  }

  async getMonthlyReport() {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const weeklyStats = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: monthAgo, $lte: today },
        },
      },
      {
        $group: {
          _id: {
            week: { $isoWeek: '$date' },
            year: { $isoWeekYear: '$date' },
          },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
    ]);

    const totalThisMonth = weeklyStats.reduce((sum, week) => sum + week.count, 0);
    const totalCompleted = weeklyStats.reduce((sum, week) => sum + week.completed, 0);
    const totalRevenue = weeklyStats.reduce((sum, week) => sum + week.revenue, 0);

    return {
      period: 'monthly',
      startDate: monthAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
      weeklyStats,
      summary: {
        totalAppointments: totalThisMonth,
        completedAppointments: totalCompleted,
        completionRate: totalThisMonth > 0 ? Math.round((totalCompleted / totalThisMonth) * 100) : 0,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
      },
    };
  }

  async getOverviewStats() {
    const [totalPatients, totalDoctors, appointmentStats] = await Promise.all([
      User.countDocuments({ role: 'patient', isActive: true }),
      Doctor.countDocuments({ isAvailable: true }),
      this.getAppointmentStats(),
    ]);

    return {
      totalPatients,
      totalDoctors,
      ...appointmentStats,
    };
  }
}

module.exports = new AnalyticsService();
