const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const { validateAppointment } = require('../middleware/validate');
const { auditLogger } = require('../middleware/auditLogger');

router.post('/', protect, validateAppointment, auditLogger('CREATE', 'appointment'), appointmentController.bookAppointment);
router.get('/', protect, appointmentController.getAppointments);
router.get('/upcoming', protect, appointmentController.getUpcomingAppointments);
router.get('/:id', protect, appointmentController.getAppointmentById);
router.put('/:id', protect, auditLogger('UPDATE', 'appointment'), appointmentController.updateAppointment);
router.put('/:id/cancel', protect, auditLogger('UPDATE', 'appointment'), appointmentController.cancelAppointment);
router.put('/:id/reschedule', protect, auditLogger('UPDATE', 'appointment'), appointmentController.rescheduleAppointment);
router.put('/:id/complete', protect, authorize('doctor', 'admin'), auditLogger('UPDATE', 'appointment'), appointmentController.completeAppointment);

module.exports = router;
