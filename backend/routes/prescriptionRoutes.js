const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const { validatePrescription } = require('../middleware/validate');
const { auditLogger } = require('../middleware/auditLogger');

router.post('/', protect, authorize('doctor'), validatePrescription, auditLogger('CREATE', 'prescription'), prescriptionController.createPrescription);
router.get('/', protect, prescriptionController.getPrescriptions);
router.get('/:id', protect, prescriptionController.getPrescriptionById);
router.get('/:id/download', protect, auditLogger('DOWNLOAD', 'prescription'), prescriptionController.downloadPrescription);

module.exports = router;
