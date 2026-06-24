const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const { auditLogger } = require('../middleware/auditLogger');

router.use(protect, authorize('admin'));

router.get('/users', adminController.getUsers);
router.put('/users/:id', auditLogger('UPDATE', 'user'), adminController.updateUser);
router.delete('/users/:id', auditLogger('DELETE', 'user'), adminController.deleteUser);
router.post('/doctors', auditLogger('CREATE', 'doctor'), adminController.addDoctor);
router.put('/doctors/:id', auditLogger('UPDATE', 'doctor'), adminController.updateDoctor);
router.get('/reports', adminController.getReports);

module.exports = router;
