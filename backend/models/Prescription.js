const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: [true, 'Appointment reference is required'],
    },
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
    diagnosis: {
      type: String,
      required: [true, 'Diagnosis is required'],
      trim: true,
    },
    medications: [
      {
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
        instructions: { type: String, default: '' },
      },
    ],
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },
    issuedDate: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
    },
    followUpRecommended: {
      type: Boolean,
      default: false,
    },
    followUpDate: Date,
    labTestsRecommended: [{ type: String }],
    dietaryAdvice: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

prescriptionSchema.index({ patient: 1, issuedDate: -1 });
prescriptionSchema.index({ appointment: 1 });
prescriptionSchema.index({ doctor: 1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
