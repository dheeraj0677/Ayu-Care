const Review = require('../models/Review');
const Doctor = require('../models/Doctor');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const { getPaginationParams, createPaginationMeta } = require('../utils/helpers');

exports.getDoctorReviews = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);

    const [reviews, total] = await Promise.all([
      Review.find({ doctor: req.params.id })
        .populate('patient', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments({ doctor: req.params.id }),
    ]);

    const pagination = createPaginationMeta(total, page, limit);
    return paginatedResponse(res, reviews, pagination, 'Reviews retrieved.');
  } catch (err) {
    next(err);
  }
};

exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const doctorId = req.params.id;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return errorResponse(res, 'Doctor not found.', 404);
    }

    const existingReview = await Review.findOne({
      patient: req.user._id,
      doctor: doctorId,
    });

    if (existingReview) {
      existingReview.rating = rating;
      existingReview.comment = comment;
      await existingReview.save();
      return successResponse(res, { review: existingReview }, 'Review updated successfully.');
    }

    const review = await Review.create({
      patient: req.user._id,
      doctor: doctorId,
      appointment: req.body.appointment,
      rating,
      comment,
    });

    const populatedReview = await Review.findById(review._id).populate('patient', 'name avatar');
    return successResponse(res, { review: populatedReview }, 'Review added successfully.', 201);
  } catch (err) {
    next(err);
  }
};
