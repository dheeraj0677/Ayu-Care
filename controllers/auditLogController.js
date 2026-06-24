const AuditLog = require('../models/AuditLog');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const { getPaginationParams, createPaginationMeta } = require('../utils/helpers');

exports.getAuditLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const filter = {};

    if (req.query.action) filter.action = req.query.action;
    if (req.query.resource) filter.resource = req.query.resource;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.userId) filter.user = req.query.userId;
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) filter.createdAt.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.createdAt.$lte = new Date(req.query.endDate);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    const pagination = createPaginationMeta(total, page, limit);
    return paginatedResponse(res, logs, pagination, 'Audit logs retrieved.');
  } catch (err) {
    next(err);
  }
};

exports.getUserLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);

    const [logs, total] = await Promise.all([
      AuditLog.find({ user: req.params.userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments({ user: req.params.userId }),
    ]);

    const pagination = createPaginationMeta(total, page, limit);
    return paginatedResponse(res, logs, pagination, 'User audit logs retrieved.');
  } catch (err) {
    next(err);
  }
};

exports.getSecurityLogs = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);

    const [logs, total] = await Promise.all([
      AuditLog.find({ category: 'security' })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments({ category: 'security' }),
    ]);

    const pagination = createPaginationMeta(total, page, limit);
    return paginatedResponse(res, logs, pagination, 'Security logs retrieved.');
  } catch (err) {
    next(err);
  }
};
