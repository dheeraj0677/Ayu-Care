const jwt = require('jsonwebtoken');
const User = require('../models/User');
const jwtConfig = require('../config/jwt');
const { errorResponse } = require('../utils/apiResponse');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 'Not authorized. No token provided.', 401);
    }

    const decoded = jwt.verify(token, jwtConfig.secret);
    const user = await User.findById(decoded.id).select('-password -refreshToken');

    if (!user) {
      return errorResponse(res, 'User not found. Token is invalid.', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Account has been deactivated.', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token has expired. Please login again.', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token. Please login again.', 401);
    }
    return errorResponse(res, 'Authentication failed.', 401);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, jwtConfig.secret);
      req.user = await User.findById(decoded.id).select('-password -refreshToken');
    }
  } catch (error) {
    // Token invalid or expired — continue without user
  }
  next();
};

module.exports = { protect, optionalAuth };
