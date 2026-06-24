const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const { validateDepartment } = require('../middleware/validate');
const { auditLogger } = require('../middleware/auditLogger');

router.get('/', departmentController.getAllDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.post('/', protect, authorize('admin'), validateDepartment, auditLogger('CREATE', 'department'), departmentController.createDepartment);
router.put('/:id', protect, authorize('admin'), auditLogger('UPDATE', 'department'), departmentController.updateDepartment);
router.delete('/:id', protect, authorize('admin'), auditLogger('DELETE', 'department'), departmentController.deleteDepartment);

module.exports = router;
