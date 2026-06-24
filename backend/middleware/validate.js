const { errorResponse } = require('../utils/apiResponse');
const { validators } = require('../utils/validators');

const validateRegistration = (req, res, next) => {
  const { name, email, password, phone } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) errors.push('Name must be at least 2 characters.');
  if (!email || !validators.isValidEmail(email)) errors.push('Please provide a valid email address.');
  if (!password || !validators.isValidPassword(password)) {
    errors.push('Password must be at least 6 characters with at least one uppercase letter, one lowercase letter, and one number.');
  }
  if (phone && !validators.isValidPhone(phone)) errors.push('Please provide a valid phone number.');

  if (errors.length > 0) {
    return errorResponse(res, errors.join(' '), 400);
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !validators.isValidEmail(email)) errors.push('Please provide a valid email.');
  if (!password) errors.push('Password is required.');

  if (errors.length > 0) {
    return errorResponse(res, errors.join(' '), 400);
  }
  next();
};

const validateAppointment = (req, res, next) => {
  const { doctor, department, date, timeSlot } = req.body;
  const errors = [];

  if (!doctor) errors.push('Doctor is required.');
  if (!department) errors.push('Department is required.');
  if (!date) errors.push('Appointment date is required.');
  if (!timeSlot || !timeSlot.startTime) errors.push('Time slot is required.');

  if (date) {
    const appointmentDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (appointmentDate < today) errors.push('Appointment date cannot be in the past.');
  }

  if (errors.length > 0) {
    return errorResponse(res, errors.join(' '), 400);
  }
  next();
};

const validatePrescription = (req, res, next) => {
  const { appointment, patient, diagnosis, medications } = req.body;
  const errors = [];

  if (!appointment) errors.push('Appointment reference is required.');
  if (!patient) errors.push('Patient reference is required.');
  if (!diagnosis || diagnosis.trim().length < 3) errors.push('Diagnosis is required (min 3 characters).');
  if (!medications || !Array.isArray(medications) || medications.length === 0) {
    errors.push('At least one medication is required.');
  } else {
    medications.forEach((med, i) => {
      if (!med.name) errors.push(`Medication ${i + 1}: Name is required.`);
      if (!med.dosage) errors.push(`Medication ${i + 1}: Dosage is required.`);
      if (!med.frequency) errors.push(`Medication ${i + 1}: Frequency is required.`);
      if (!med.duration) errors.push(`Medication ${i + 1}: Duration is required.`);
    });
  }

  if (errors.length > 0) {
    return errorResponse(res, errors.join(' '), 400);
  }
  next();
};

const validateDepartment = (req, res, next) => {
  const { name, description } = req.body;
  const errors = [];

  if (!name || name.trim().length < 2) errors.push('Department name must be at least 2 characters.');
  if (!description || description.trim().length < 10) errors.push('Description must be at least 10 characters.');

  if (errors.length > 0) {
    return errorResponse(res, errors.join(' '), 400);
  }
  next();
};

const validateReview = (req, res, next) => {
  const { rating, comment } = req.body;
  const errors = [];

  if (!rating || rating < 1 || rating > 5) errors.push('Rating must be between 1 and 5.');
  if (comment && comment.length > 500) errors.push('Comment cannot exceed 500 characters.');

  if (errors.length > 0) {
    return errorResponse(res, errors.join(' '), 400);
  }
  next();
};

const validateHealthRecord = (req, res, next) => {
  const { heartRate, bloodPressure, bloodGlucose, bodyWeight } = req.body;
  const errors = [];

  if (heartRate && heartRate.value && (heartRate.value < 0 || heartRate.value > 300)) {
    errors.push('Heart rate must be between 0 and 300 bpm.');
  }
  if (bloodPressure) {
    if (bloodPressure.systolic && (bloodPressure.systolic < 0 || bloodPressure.systolic > 300)) {
      errors.push('Systolic BP must be between 0 and 300.');
    }
    if (bloodPressure.diastolic && (bloodPressure.diastolic < 0 || bloodPressure.diastolic > 200)) {
      errors.push('Diastolic BP must be between 0 and 200.');
    }
  }
  if (bloodGlucose && bloodGlucose.value && (bloodGlucose.value < 0 || bloodGlucose.value > 1000)) {
    errors.push('Blood glucose must be between 0 and 1000.');
  }
  if (bodyWeight && bodyWeight.value && (bodyWeight.value < 0 || bodyWeight.value > 500)) {
    errors.push('Body weight must be between 0 and 500.');
  }

  if (errors.length > 0) {
    return errorResponse(res, errors.join(' '), 400);
  }
  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateAppointment,
  validatePrescription,
  validateDepartment,
  validateReview,
  validateHealthRecord,
};
