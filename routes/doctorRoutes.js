const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const reviewController = require('../controllers/reviewController');
const { protect, optionalAuth } = require('../middleware/auth');
const { validateReview } = require('../middleware/validate');

router.get('/', optionalAuth, doctorController.getAllDoctors);
router.get('/search', optionalAuth, doctorController.searchDoctors);
router.get('/:id', optionalAuth, doctorController.getDoctorById);
router.get('/:id/slots', optionalAuth, doctorController.getDoctorSlots);
router.get('/:id/reviews', reviewController.getDoctorReviews);
router.post('/:id/reviews', protect, validateReview, reviewController.addReview);
router.get('/department/:deptId', optionalAuth, doctorController.getDoctorsByDepartment);

module.exports = router;
