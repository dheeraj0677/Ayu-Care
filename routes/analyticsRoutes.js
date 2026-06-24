const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');

router.get('/appointments', protect, authorize('admin', 'doctor'), dashboardController.getAppointmentAnalytics);
router.get('/weekly-report', protect, authorize('admin', 'doctor'), dashboardController.getWeeklyReport);
router.get('/monthly-report', protect, authorize('admin', 'doctor'), dashboardController.getMonthlyReport);
router.get('/department-stats', protect, authorize('admin'), dashboardController.getDepartmentStats);

module.exports = router;
