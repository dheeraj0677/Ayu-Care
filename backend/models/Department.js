const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Department name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    icon: {
      type: String,
      default: 'medical',
    },
    image: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    headDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    servicesOffered: [{ type: String }],
    contactNumber: { type: String },
    location: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

departmentSchema.index({ name: 1 }, { unique: true });
departmentSchema.index({ isActive: 1 });

departmentSchema.virtual('doctors', {
  ref: 'Doctor',
  localField: '_id',
  foreignField: 'department',
});

module.exports = mongoose.model('Department', departmentSchema);
