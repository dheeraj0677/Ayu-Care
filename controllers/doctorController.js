const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Department = require('../models/Department');
const TimeSlot = require('../models/TimeSlot');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const { getPaginationParams, createPaginationMeta, getSortOptions, buildSearchQuery } = require('../utils/helpers');

exports.getAllDoctors = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const sort = getSortOptions(req.query);

    const filter = { isAvailable: true };
    if (req.query.department) filter.department = req.query.department;
    if (req.query.specialization) {
      filter.specialization = new RegExp(req.query.specialization, 'i');
    }
    if (req.query.minRating) filter.rating = { $gte: parseFloat(req.query.minRating) };

    const [doctors, total] = await Promise.all([
      Doctor.find(filter)
        .populate('userId', 'name email avatar phone')
        .populate('department', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Doctor.countDocuments(filter),
    ]);

    const pagination = createPaginationMeta(total, page, limit);
    return paginatedResponse(res, doctors, pagination, 'Doctors retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

exports.getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('userId', 'name email avatar phone gender')
      .populate('department', 'name description');

    if (!doctor) {
      return errorResponse(res, 'Doctor not found.', 404);
    }

    return successResponse(res, { doctor }, 'Doctor retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

exports.getDoctorSlots = async (req, res, next) => {
  try {
    const { date } = req.query;
    const filter = { doctor: req.params.id };

    if (date) {
      const queryDate = new Date(date);
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.date = { $gte: queryDate, $lt: nextDay };
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filter.date = { $gte: today };
    }

    const slots = await TimeSlot.find(filter).sort({ date: 1, startTime: 1 });
    return successResponse(res, { slots }, 'Time slots retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

exports.searchDoctors = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return errorResponse(res, 'Search query must be at least 2 characters.', 400);
    }

    const { page, limit, skip } = getPaginationParams(req.query);

    const userIds = await User.find(
      buildSearchQuery(q, ['name']),
      '_id'
    );

    const doctorFilter = {
      isAvailable: true,
      $or: [
        { specialization: new RegExp(q, 'i') },
        { userId: { $in: userIds.map((u) => u._id) } },
      ],
    };

    const [doctors, total] = await Promise.all([
      Doctor.find(doctorFilter)
        .populate('userId', 'name email avatar')
        .populate('department', 'name')
        .skip(skip)
        .limit(limit),
      Doctor.countDocuments(doctorFilter),
    ]);

    const pagination = createPaginationMeta(total, page, limit);
    return paginatedResponse(res, doctors, pagination, 'Search results retrieved.');
  } catch (err) {
    next(err);
  }
};

exports.getDoctorsByDepartment = async (req, res, next) => {
  try {
    const doctors = await Doctor.find({
      department: req.params.deptId,
      isAvailable: true,
    })
      .populate('userId', 'name email avatar')
      .populate('department', 'name')
      .sort({ rating: -1 });

    return successResponse(res, { doctors }, 'Doctors by department retrieved.');
  } catch (err) {
    next(err);
  }
};
