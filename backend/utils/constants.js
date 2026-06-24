const ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin',
};

const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show',
};

const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  REFUNDED: 'refunded',
};

const NOTIFICATION_TYPES = {
  APPOINTMENT: 'appointment',
  PRESCRIPTION: 'prescription',
  LAB_RESULT: 'lab-result',
  REMINDER: 'reminder',
  FEEDBACK: 'feedback',
  SYSTEM: 'system',
  ALERT: 'alert',
};

const DOCUMENT_CATEGORIES = {
  LAB_REPORT: 'lab-report',
  RADIOLOGY: 'radiology',
  PRESCRIPTION: 'prescription',
  DISCHARGE_SUMMARY: 'discharge-summary',
  INSURANCE: 'insurance',
  OTHER: 'other',
};

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
];

const DEPARTMENTS = [
  'Cardiology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'General Medicine',
  'Dermatology',
  'Ophthalmology',
  'ENT',
];

const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

const HEALTH_STATUS = {
  EXCELLENT: 'excellent',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
  CRITICAL: 'critical',
};

module.exports = {
  ROLES,
  APPOINTMENT_STATUS,
  PAYMENT_STATUS,
  NOTIFICATION_TYPES,
  DOCUMENT_CATEGORIES,
  TIME_SLOTS,
  DEPARTMENTS,
  PAGINATION,
  HEALTH_STATUS,
};
