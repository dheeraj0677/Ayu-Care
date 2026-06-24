const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const TimeSlot = require('../models/TimeSlot');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const { getPaginationParams, createPaginationMeta, formatDate } = require('../utils/helpers');
const notificationService = require('../services/notificationService');
const emailService = require('../services/emailService');

exports.bookAppointment = async (req, res, next) => {
  try {
    const { doctor: doctorId, department, date, timeSlot, reason, symptoms } = req.body;

    const doctor = await Doctor.findById(doctorId).populate('userId', 'name email');
    if (!doctor) {
      return errorResponse(res, 'Doctor not found.', 404);
    }

    if (!doctor.isAvailable) {
      return errorResponse(res, 'Doctor is currently not available.', 400);
    }

    const appointmentDate = new Date(date);
    const existingSlot = await TimeSlot.findOne({
      doctor: doctorId,
      date: appointmentDate,
      startTime: timeSlot.startTime,
      isBooked: true,
    });

    if (existingSlot) {
      return errorResponse(res, 'This time slot is already booked. Please choose another slot.', 400);
    }

    const existingAppointment = await Appointment.findOne({
      patient: req.user._id,
      doctor: doctorId,
      date: appointmentDate,
      status: { $in: ['pending', 'confirmed'] },
    });

    if (existingAppointment) {
      return errorResponse(res, 'You already have an active appointment with this doctor on this date.', 400);
    }

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      department,
      date: appointmentDate,
      timeSlot: {
        startTime: timeSlot.startTime,
        endTime: timeSlot.endTime || calculateEndTime(timeSlot.startTime),
      },
      reason,
      symptoms,
      consultationFee: doctor.consultationFee,
      status: 'confirmed',
      paymentStatus: 'pending',
    });

    await TimeSlot.findOneAndUpdate(
      { doctor: doctorId, date: appointmentDate, startTime: timeSlot.startTime },
      { isBooked: true, bookedBy: req.user._id, appointment: appointment._id },
      { upsert: true, new: true }
    );

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'name email')
      .populate({ path: 'doctor', populate: { path: 'userId', select: 'name' } })
      .populate('department', 'name');

    const appointmentDetails = {
      appointmentId: appointment.appointmentId,
      doctorName: doctor.userId.name,
      department: populatedAppointment.department?.name || 'General',
      date: formatDate(appointment.date),
      time: appointment.timeSlot.startTime,
      status: 'confirmed',
    };

    await notificationService.createAppointmentNotification(req.user._id, appointmentDetails);
    await emailService.sendAppointmentConfirmation(req.user.email, appointmentDetails);

    return successResponse(res, { appointment: populatedAppointment }, 'Appointment booked successfully!', 201);
  } catch (err) {
    next(err);
  }
};

exports.getAppointments = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const filter = {};

    if (req.user.role === 'patient') {
      filter.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ userId: req.user._id });
      if (doctorProfile) filter.doctor = doctorProfile._id;
    }

    if (req.query.status) filter.status = req.query.status;
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    }

    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate('patient', 'name email avatar')
        .populate({ path: 'doctor', populate: [{ path: 'userId', select: 'name avatar' }, { path: 'department', select: 'name' }] })
        .populate('department', 'name')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      Appointment.countDocuments(filter),
    ]);

    const pagination = createPaginationMeta(total, page, limit);
    return paginatedResponse(res, appointments, pagination, 'Appointments retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

exports.getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email phone avatar age gender bloodGroup')
      .populate({ path: 'doctor', populate: [{ path: 'userId', select: 'name avatar email' }, { path: 'department', select: 'name' }] })
      .populate('department', 'name')
      .populate('medicalDocuments');

    if (!appointment) {
      return errorResponse(res, 'Appointment not found.', 404);
    }

    if (req.user.role === 'patient' && appointment.patient._id.toString() !== req.user._id.toString()) {
      return errorResponse(res, 'Not authorized to view this appointment.', 403);
    }

    return successResponse(res, { appointment }, 'Appointment details retrieved.');
  } catch (err) {
    next(err);
  }
};

exports.updateAppointment = async (req, res, next) => {
  try {
    const allowedUpdates = ['reason', 'symptoms', 'notes', 'status'];
    const updates = {};
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const appointment = await Appointment.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('patient', 'name email')
      .populate({ path: 'doctor', populate: { path: 'userId', select: 'name' } })
      .populate('department', 'name');

    if (!appointment) {
      return errorResponse(res, 'Appointment not found.', 404);
    }

    return successResponse(res, { appointment }, 'Appointment updated successfully.');
  } catch (err) {
    next(err);
  }
};

exports.cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({ path: 'doctor', populate: { path: 'userId', select: 'name' } });

    if (!appointment) {
      return errorResponse(res, 'Appointment not found.', 404);
    }

    if (['completed', 'cancelled'].includes(appointment.status)) {
      return errorResponse(res, `Cannot cancel an appointment that is already ${appointment.status}.`, 400);
    }

    appointment.status = 'cancelled';
    appointment.cancelledBy = req.user.role;
    appointment.cancellationReason = req.body.reason || '';
    await appointment.save();

    await TimeSlot.findOneAndUpdate(
      { appointment: appointment._id },
      { isBooked: false, bookedBy: null, appointment: null }
    );

    await notificationService.createAppointmentNotification(appointment.patient, {
      appointmentId: appointment.appointmentId,
      doctorName: appointment.doctor?.userId?.name || 'Doctor',
      date: formatDate(appointment.date),
      time: appointment.timeSlot.startTime,
      status: 'cancelled',
    });

    return successResponse(res, { appointment }, 'Appointment cancelled successfully.');
  } catch (err) {
    next(err);
  }
};

exports.rescheduleAppointment = async (req, res, next) => {
  try {
    const { date, timeSlot } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return errorResponse(res, 'Appointment not found.', 404);
    }

    if (['completed', 'cancelled'].includes(appointment.status)) {
      return errorResponse(res, `Cannot reschedule a ${appointment.status} appointment.`, 400);
    }

    await TimeSlot.findOneAndUpdate(
      { appointment: appointment._id },
      { isBooked: false, bookedBy: null, appointment: null }
    );

    const newDate = new Date(date);
    appointment.date = newDate;
    appointment.timeSlot = {
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime || calculateEndTime(timeSlot.startTime),
    };
    appointment.status = 'confirmed';
    await appointment.save();

    await TimeSlot.findOneAndUpdate(
      { doctor: appointment.doctor, date: newDate, startTime: timeSlot.startTime },
      { isBooked: true, bookedBy: appointment.patient, appointment: appointment._id },
      { upsert: true, new: true }
    );

    return successResponse(res, { appointment }, 'Appointment rescheduled successfully.');
  } catch (err) {
    next(err);
  }
};

exports.completeAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({ path: 'doctor', populate: { path: 'userId', select: 'name' } });

    if (!appointment) {
      return errorResponse(res, 'Appointment not found.', 404);
    }

    appointment.status = 'completed';
    appointment.paymentStatus = 'paid';
    await appointment.save();

    await notificationService.createAppointmentNotification(appointment.patient, {
      appointmentId: appointment.appointmentId,
      doctorName: appointment.doctor?.userId?.name || 'Doctor',
      date: formatDate(appointment.date),
      time: appointment.timeSlot.startTime,
      status: 'completed',
    });

    await notificationService.createFeedbackNotification(
      appointment.patient,
      appointment.doctor?.userId?.name || 'Doctor'
    );

    return successResponse(res, { appointment }, 'Appointment marked as completed.');
  } catch (err) {
    next(err);
  }
};

exports.getUpcomingAppointments = async (req, res, next) => {
  try {
    const now = new Date();
    const filter = {
      date: { $gte: now },
      status: { $in: ['pending', 'confirmed'] },
    };

    if (req.user.role === 'patient') {
      filter.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ userId: req.user._id });
      if (doctorProfile) filter.doctor = doctorProfile._id;
    }

    const appointments = await Appointment.find(filter)
      .populate('patient', 'name avatar')
      .populate({ path: 'doctor', populate: [{ path: 'userId', select: 'name avatar' }, { path: 'department', select: 'name' }] })
      .populate('department', 'name')
      .sort({ date: 1 })
      .limit(10);

    return successResponse(res, { appointments }, 'Upcoming appointments retrieved.');
  } catch (err) {
    next(err);
  }
};

function calculateEndTime(startTime) {
  const [time, period] = startTime.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  minutes += 30;
  if (minutes >= 60) { hours++; minutes -= 60; }
  const newPeriod = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
  return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${newPeriod}`;
}
