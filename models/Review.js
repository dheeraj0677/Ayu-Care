const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required'],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor reference is required'],
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    response: {
      text: String,
      respondedAt: Date,
    },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ doctor: 1, createdAt: -1 });
reviewSchema.index({ patient: 1, doctor: 1 });

reviewSchema.statics.calculateAverageRating = async function (doctorId) {
  const result = await this.aggregate([
    { $match: { doctor: doctorId } },
    {
      $group: {
        _id: '$doctor',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const Doctor = mongoose.model('Doctor');
  if (result.length > 0) {
    await Doctor.findByIdAndUpdate(doctorId, {
      rating: Math.round(result[0].averageRating * 10) / 10,
      totalReviews: result[0].totalReviews,
    });
  } else {
    await Doctor.findByIdAndUpdate(doctorId, { rating: 0, totalReviews: 0 });
  }
};

reviewSchema.post('save', function () {
  this.constructor.calculateAverageRating(this.doctor);
});

reviewSchema.post('findOneAndDelete', function (doc) {
  if (doc) {
    doc.constructor.calculateAverageRating(doc.doctor);
  }
});

module.exports = mongoose.model('Review', reviewSchema);
