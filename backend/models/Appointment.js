const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      unique: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient is required'],
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor is required'],
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    date: {
      type: Date,
      required: [true, 'Appointment date is required'],
    },
    timeSlot: {
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
      default: 'pending',
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    symptoms: [{ type: String }],
    consultationFee: {
      type: Number,
      required: true,
      min: 0,
    },
    serviceTax: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
    },
    medicalDocuments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MedicalDocument',
      },
    ],
    followUpDate: Date,
    cancelledBy: {
      type: String,
      enum: ['patient', 'doctor', 'admin', ''],
      default: '',
    },
    cancellationReason: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

appointmentSchema.index({ patient: 1, date: -1 });
appointmentSchema.index({ doctor: 1, date: -1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ appointmentId: 1 }, { unique: true });
appointmentSchema.index({ date: 1 });

appointmentSchema.pre('save', async function (next) {
  if (!this.appointmentId) {
    const count = await mongoose.model('Appointment').countDocuments();
    this.appointmentId = `AYU-${String(count + 1001).padStart(4, '0')}`;
  }
  if (this.consultationFee) {
    this.serviceTax = Math.round(this.consultationFee * 0.05 * 100) / 100;
    this.totalAmount = this.consultationFee + this.serviceTax;
  }
  next();
});

appointmentSchema.virtual('prescriptions', {
  ref: 'Prescription',
  localField: '_id',
  foreignField: 'appointment',
});

module.exports = mongoose.model('Appointment', appointmentSchema);
