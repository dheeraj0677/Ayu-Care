const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validateRegistration, validateLogin } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { auditLogger } = require('../middleware/auditLogger');

router.post('/register', authLimiter, validateRegistration, auditLogger('REGISTER', 'user'), authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/logout', protect, auditLogger('LOGOUT', 'system'), authController.logout);
router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, auditLogger('UPDATE', 'user'), authController.updateProfile);
router.post('/change-password', protect, auditLogger('PASSWORD_CHANGE', 'user'), authController.changePassword);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/refresh-token', authController.refreshToken);

module.exports = router;
