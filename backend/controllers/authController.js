const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const jwtConfig = require('../config/jwt');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { logSecurityEvent } = require('../middleware/auditLogger');
const emailService = require('../services/emailService');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
    issuer: jwtConfig.issuer,
  });
  const refreshToken = jwt.sign({ id: userId }, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
    issuer: jwtConfig.issuer,
  });
  return { accessToken, refreshToken };
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, gender, age, bloodGroup, role } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse(res, 'An account with this email already exists.', 400);
    }

    const userRole = (role === 'admin' || role === 'doctor') ? 'patient' : (role || 'patient');

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      gender,
      age,
      bloodGroup,
      role: userRole,
    });

    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    await logSecurityEvent(user._id, user.name, 'REGISTER', `New user registered: ${email}`, req);
    await emailService.sendWelcomeEmail(email, name);

    return successResponse(
      res,
      {
        user: user.toSafeObject(),
        accessToken,
        refreshToken,
      },
      'Registration successful! Welcome to AyuCare.',
      201
    );
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      await logSecurityEvent(null, email, 'LOGIN_FAILED', `Failed login attempt for: ${email}`, req);
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Your account has been deactivated. Please contact support.', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await logSecurityEvent(user._id, user.name, 'LOGIN_FAILED', `Invalid password for: ${email}`, req);
      return errorResponse(res, 'Invalid email or password.', 401);
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    await logSecurityEvent(user._id, user.name, 'LOGIN', `Successful login: ${email}`, req);

    return successResponse(res, {
      user: user.toSafeObject(),
      accessToken,
      refreshToken,
    }, 'Login successful!');
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: '' });
      await logSecurityEvent(req.user._id, req.user.name, 'LOGOUT', 'User logged out', req);
    }
    return successResponse(res, null, 'Logged out successfully.');
  } catch (err) {
    next(err);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return errorResponse(res, 'User not found.', 404);
    }
    return successResponse(res, { user: user.toSafeObject() });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'phone', 'gender', 'age', 'bloodGroup', 'address', 'avatar', 'preferences'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return errorResponse(res, 'User not found.', 404);
    }

    return successResponse(res, { user: user.toSafeObject() }, 'Profile updated successfully.');
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Current password and new password are required.', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse(res, 'New password must be at least 6 characters.', 400);
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return errorResponse(res, 'Current password is incorrect.', 401);
    }

    user.password = newPassword;
    await user.save();

    await logSecurityEvent(user._id, user.name, 'PASSWORD_CHANGE', 'Password changed successfully', req);

    return successResponse(res, null, 'Password changed successfully.');
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return successResponse(res, null, 'If an account exists with this email, a password reset link has been sent.');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    await emailService.sendPasswordResetEmail(email, resetToken);
    await logSecurityEvent(user._id, user.name, 'PASSWORD_RESET', 'Password reset requested', req);

    return successResponse(res, null, 'If an account exists with this email, a password reset link has been sent.');
  } catch (err) {
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return errorResponse(res, 'Refresh token is required.', 400);
    }

    const decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return errorResponse(res, 'Invalid refresh token.', 401);
    }

    const tokens = generateTokens(user._id);
    user.refreshToken = tokens.refreshToken;
    await user.save();

    return successResponse(res, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    }, 'Token refreshed successfully.');
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Refresh token expired. Please login again.', 401);
    }
    next(err);
  }
};
