const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    userName: {
      type: String,
      default: 'System',
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: [
        'CREATE',
        'READ',
        'UPDATE',
        'DELETE',
        'LOGIN',
        'LOGOUT',
        'LOGIN_FAILED',
        'PASSWORD_CHANGE',
        'PASSWORD_RESET',
        'REGISTER',
        'ROLE_CHANGE',
        'EXPORT',
        'UPLOAD',
        'DOWNLOAD',
      ],
    },
    resource: {
      type: String,
      required: [true, 'Resource type is required'],
      enum: [
        'user',
        'doctor',
        'appointment',
        'prescription',
        'department',
        'health-record',
        'medical-document',
        'notification',
        'review',
        'time-slot',
        'system',
      ],
    },
    resourceId: {
      type: String,
      default: '',
    },
    details: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    previousData: {
      type: mongoose.Schema.Types.Mixed,
    },
    newData: {
      type: mongoose.Schema.Types.Mixed,
    },
    ip: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
    statusCode: {
      type: Number,
    },
    category: {
      type: String,
      enum: ['security', 'data', 'system', 'access'],
      default: 'data',
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1 });
auditLogSchema.index({ category: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
