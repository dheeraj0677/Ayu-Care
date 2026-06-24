const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');

router.use(protect, authorize('admin'));

router.get('/', auditLogController.getAuditLogs);
router.get('/security', auditLogController.getSecurityLogs);
router.get('/user/:userId', auditLogController.getUserLogs);

module.exports = router;
