const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required'],
    },
    heartRate: {
      value: { type: Number, min: 0, max: 300 },
      unit: { type: String, default: 'bpm' },
    },
    bloodPressure: {
      systolic: { type: Number, min: 0, max: 300 },
      diastolic: { type: Number, min: 0, max: 200 },
      unit: { type: String, default: 'mmHg' },
    },
    bloodGlucose: {
      value: { type: Number, min: 0, max: 1000 },
      unit: { type: String, default: 'mg/dL' },
    },
    bodyWeight: {
      value: { type: Number, min: 0, max: 500 },
      unit: { type: String, default: 'kg' },
    },
    bodyTemperature: {
      value: { type: Number, min: 30, max: 45 },
      unit: { type: String, default: '°C' },
    },
    oxygenSaturation: {
      value: { type: Number, min: 0, max: 100 },
      unit: { type: String, default: '%' },
    },
    healthScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    healthStatus: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'critical'],
      default: 'good',
    },
    allergies: [{ type: String }],
    chronicConditions: [{ type: String }],
    recordDate: {
      type: Date,
      default: Date.now,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

healthRecordSchema.index({ patient: 1, recordDate: -1 });

healthRecordSchema.pre('save', function (next) {
  let score = 100;
  if (this.heartRate && this.heartRate.value) {
    if (this.heartRate.value < 60 || this.heartRate.value > 100) score -= 10;
  }
  if (this.bloodPressure && this.bloodPressure.systolic) {
    if (this.bloodPressure.systolic > 140 || this.bloodPressure.diastolic > 90) score -= 15;
  }
  if (this.bloodGlucose && this.bloodGlucose.value) {
    if (this.bloodGlucose.value > 126 || this.bloodGlucose.value < 70) score -= 10;
  }
  this.healthScore = Math.max(0, score);
  if (score >= 85) this.healthStatus = 'excellent';
  else if (score >= 70) this.healthStatus = 'good';
  else if (score >= 50) this.healthStatus = 'fair';
  else if (score >= 30) this.healthStatus = 'poor';
  else this.healthStatus = 'critical';
  next();
});

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
