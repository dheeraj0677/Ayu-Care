const express = require('express');
const router = express.Router();
const healthRecordController = require('../controllers/healthRecordController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const { validateHealthRecord } = require('../middleware/validate');
const { upload, handleUploadError } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { auditLogger } = require('../middleware/auditLogger');

router.get('/', protect, healthRecordController.getHealthRecords);
router.post('/', protect, authorize('doctor', 'admin'), validateHealthRecord, auditLogger('CREATE', 'health-record'), healthRecordController.addHealthRecord);
router.get('/vitals', protect, healthRecordController.getLatestVitals);
router.get('/vitals/:patientId', protect, authorize('doctor', 'admin'), healthRecordController.getLatestVitals);
router.post('/documents', protect, uploadLimiter, upload.single('document'), handleUploadError, auditLogger('UPLOAD', 'medical-document'), healthRecordController.uploadDocument);
router.get('/documents', protect, healthRecordController.getDocuments);
router.get('/documents/:id/download', protect, auditLogger('DOWNLOAD', 'medical-document'), healthRecordController.downloadDocument);
router.delete('/documents/:id', protect, auditLogger('DELETE', 'medical-document'), healthRecordController.deleteDocument);

module.exports = router;
