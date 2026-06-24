const analyticsService = require('../services/analyticsService');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const HealthRecord = require('../models/HealthRecord');
const Notification = require('../models/Notification');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.getPatientDashboard = async (req, res, next) => {
  try {
    const patientId = req.user._id;

    const [
      upcomingAppointments,
      recentAppointments,
      latestVitals,
      unreadNotifications,
      totalAppointments,
    ] = await Promise.all([
      Appointment.find({
        patient: patientId,
        date: { $gte: new Date() },
        status: { $in: ['pending', 'confirmed'] },
      })
        .populate({ path: 'doctor', populate: [{ path: 'userId', select: 'name avatar' }, { path: 'department', select: 'name' }] })
        .populate('department', 'name')
        .sort({ date: 1 })
        .limit(5),
      Appointment.find({ patient: patientId })
        .populate({ path: 'doctor', populate: [{ path: 'userId', select: 'name avatar' }, { path: 'department', select: 'name' }] })
        .populate('department', 'name')
        .sort({ date: -1 })
        .limit(10),
      HealthRecord.findOne({ patient: patientId }).sort({ recordDate: -1 }),
      Notification.find({ user: patientId, isRead: false }).sort({ createdAt: -1 }).limit(5),
      Appointment.countDocuments({ patient: patientId }),
    ]);

    const statusCounts = await Appointment.aggregate([
      { $match: { patient: patientId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    return successResponse(res, {
      upcomingAppointments,
      recentAppointments,
      latestVitals,
      unreadNotifications,
      totalAppointments,
      statusCounts,
    }, 'Patient dashboard data retrieved.');
  } catch (err) {
    next(err);
  }
};

exports.getDoctorDashboard = async (req, res, next) => {
  try {
    const doctorProfile = await Doctor.findOne({ userId: req.user._id });
    if (!doctorProfile) {
      return errorResponse(res, 'Doctor profile not found.', 404);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayAppointments, upcomingAppointments, totalPatients, recentAppointments] = await Promise.all([
      Appointment.find({
        doctor: doctorProfile._id,
        date: { $gte: today, $lt: tomorrow },
        status: { $in: ['pending', 'confirmed'] },
      })
        .populate('patient', 'name avatar age gender phone')
        .sort({ 'timeSlot.startTime': 1 }),
      Appointment.find({
        doctor: doctorProfile._id,
        date: { $gt: tomorrow },
        status: { $in: ['pending', 'confirmed'] },
      })
        .populate('patient', 'name avatar')
        .populate('department', 'name')
        .sort({ date: 1 })
        .limit(10),
      Appointment.distinct('patient', { doctor: doctorProfile._id }),
      Appointment.find({ doctor: doctorProfile._id })
        .populate('patient', 'name avatar')
        .sort({ date: -1 })
        .limit(10),
    ]);

    const monthlyStats = await Appointment.aggregate([
      { $match: { doctor: doctorProfile._id } },
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
    ]);

    return successResponse(res, {
      doctorProfile,
      todayAppointments,
      upcomingAppointments,
      totalUniquePatients: totalPatients.length,
      recentAppointments,
      monthlyStats,
    }, 'Doctor dashboard data retrieved.');
  } catch (err) {
    next(err);
  }
};

exports.getAdminDashboard = async (req, res, next) => {
  try {
    const overview = await analyticsService.getOverviewStats();
    const departmentStats = await analyticsService.getDepartmentStats();
    const weeklyReport = await analyticsService.getWeeklyReport();

    return successResponse(res, {
      overview,
      departmentStats,
      weeklyReport,
    }, 'Admin dashboard data retrieved.');
  } catch (err) {
    next(err);
  }
};

exports.getAppointmentAnalytics = async (req, res, next) => {
  try {
    const stats = await analyticsService.getAppointmentStats(req.query);
    return successResponse(res, stats, 'Appointment analytics retrieved.');
  } catch (err) {
    next(err);
  }
};

exports.getWeeklyReport = async (req, res, next) => {
  try {
    const report = await analyticsService.getWeeklyReport();
    return successResponse(res, report, 'Weekly report retrieved.');
  } catch (err) {
    next(err);
  }
};

exports.getMonthlyReport = async (req, res, next) => {
  try {
    const report = await analyticsService.getMonthlyReport();
    return successResponse(res, report, 'Monthly report retrieved.');
  } catch (err) {
    next(err);
  }
};

exports.getDepartmentStats = async (req, res, next) => {
  try {
    const stats = await analyticsService.getDepartmentStats();
    return successResponse(res, stats, 'Department statistics retrieved.');
  } catch (err) {
    next(err);
  }
};
