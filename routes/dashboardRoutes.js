const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');

router.get('/patient', protect, dashboardController.getPatientDashboard);
router.get('/doctor', protect, authorize('doctor'), dashboardController.getDoctorDashboard);
router.get('/admin', protect, authorize('admin'), dashboardController.getAdminDashboard);

module.exports = router;
