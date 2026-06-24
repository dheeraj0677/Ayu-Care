const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Department = require('../models/Department');
const AuditLog = require('../models/AuditLog');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const { getPaginationParams, createPaginationMeta } = require('../utils/helpers');

exports.getUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';
    if (req.query.search) {
      const regex = new RegExp(req.query.search, 'i');
      filter.$or = [{ name: regex }, { email: regex }];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    const pagination = createPaginationMeta(total, page, limit);
    return paginatedResponse(res, users, pagination, 'Users retrieved.');
  } catch (err) {
    next(err);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'role', 'isActive', 'phone', 'gender', 'age'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password -refreshToken');

    if (!user) {
      return errorResponse(res, 'User not found.', 404);
    }

    return successResponse(res, { user }, 'User updated successfully.');
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password -refreshToken');

    if (!user) {
      return errorResponse(res, 'User not found.', 404);
    }

    return successResponse(res, null, 'User deactivated successfully.');
  } catch (err) {
    next(err);
  }
};

exports.addDoctor = async (req, res, next) => {
  try {
    const { name, email, password, phone, gender, specialization, department, experience, consultationFee, bio, qualifications, availability, languages } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse(res, 'A user with this email already exists.', 400);
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: password || 'Doctor@123',
      phone,
      gender,
      role: 'doctor',
    });

    const doctor = await Doctor.create({
      userId: user._id,
      department,
      specialization,
      experience: experience || 0,
      consultationFee: consultationFee || 500,
      bio,
      qualifications: qualifications || [],
      availability: availability || {},
      languages: languages || ['English'],
    });

    return successResponse(res, { user: user.toSafeObject(), doctor }, 'Doctor added successfully.', 201);
  } catch (err) {
    next(err);
  }
};

exports.updateDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('userId', 'name email');

    if (!doctor) {
      return errorResponse(res, 'Doctor not found.', 404);
    }

    return successResponse(res, { doctor }, 'Doctor updated successfully.');
  } catch (err) {
    next(err);
  }
};

exports.getReports = async (req, res, next) => {
  try {
    const [totalUsers, totalDoctors, totalPatients, totalAppointments, departmentStats] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'doctor' }),
      User.countDocuments({ role: 'patient' }),
      Appointment.countDocuments(),
      Appointment.aggregate([
        {
          $lookup: {
            from: 'departments',
            localField: 'department',
            foreignField: '_id',
            as: 'dept',
          },
        },
        { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$department',
            name: { $first: '$dept.name' },
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
            revenue: { $sum: '$totalAmount' },
          },
        },
        { $sort: { total: -1 } },
      ]),
    ]);

    const statusBreakdown = await Appointment.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    return successResponse(res, {
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAppointments,
      departmentStats,
      statusBreakdown,
    }, 'Reports generated.');
  } catch (err) {
    next(err);
  }
};
