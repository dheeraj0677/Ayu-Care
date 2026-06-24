const Notification = require('../models/Notification');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const { getPaginationParams, createPaginationMeta } = require('../utils/helpers');

exports.getNotifications = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const filter = { user: req.user._id };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.isRead !== undefined) filter.isRead = req.query.isRead === 'true';

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(filter),
    ]);

    const pagination = createPaginationMeta(total, page, limit);
    return paginatedResponse(res, notifications, pagination, 'Notifications retrieved.');
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return errorResponse(res, 'Notification not found.', 404);
    }

    return successResponse(res, { notification }, 'Notification marked as read.');
  } catch (err) {
    next(err);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );
    return successResponse(res, null, 'All notifications marked as read.');
  } catch (err) {
    next(err);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!notification) {
      return errorResponse(res, 'Notification not found.', 404);
    }

    return successResponse(res, null, 'Notification deleted successfully.');
  } catch (err) {
    next(err);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });
    return successResponse(res, { unreadCount: count }, 'Unread count retrieved.');
  } catch (err) {
    next(err);
  }
};
