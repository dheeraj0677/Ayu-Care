const { errorResponse } = require('../utils/apiResponse');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Role '${req.user.role}' is not authorized to access this resource.`,
        403
      );
    }

    next();
  };
};

const authorizeOwnerOrAdmin = (resourceUserField = 'patient') => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required.', 401);
    }

    if (req.user.role === 'admin') {
      return next();
    }

    const resourceUserId = req.resource?.[resourceUserField]?.toString() || '';
    if (resourceUserId && resourceUserId !== req.user._id.toString()) {
      return errorResponse(res, 'Not authorized to access this resource.', 403);
    }

    next();
  };
};

module.exports = { authorize, authorizeOwnerOrAdmin };
