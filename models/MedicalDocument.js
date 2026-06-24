const mongoose = require('mongoose');

const medicalDocumentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    fileName: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['pdf', 'jpg', 'jpeg', 'png', 'dicom'],
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: [
        'lab-report',
        'radiology',
        'prescription',
        'discharge-summary',
        'insurance',
        'other',
      ],
      default: 'other',
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
    tags: [{ type: String }],
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

medicalDocumentSchema.index({ patient: 1, uploadDate: -1 });
medicalDocumentSchema.index({ category: 1 });

module.exports = mongoose.model('MedicalDocument', medicalDocumentSchema);
