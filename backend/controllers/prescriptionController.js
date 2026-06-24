const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const { getPaginationParams, createPaginationMeta } = require('../utils/helpers');
const notificationService = require('../services/notificationService');

exports.createPrescription = async (req, res, next) => {
  try {
    const { appointment, patient, diagnosis, medications, notes, followUpRecommended, followUpDate, labTestsRecommended, dietaryAdvice } = req.body;

    const Doctor = require('../models/Doctor');
    const doctorProfile = await Doctor.findOne({ userId: req.user._id });
    if (!doctorProfile) {
      return errorResponse(res, 'Doctor profile not found.', 404);
    }

    const appointmentDoc = await Appointment.findById(appointment);
    if (!appointmentDoc) {
      return errorResponse(res, 'Appointment not found.', 404);
    }

    const prescription = await Prescription.create({
      appointment,
      patient,
      doctor: doctorProfile._id,
      diagnosis,
      medications,
      notes,
      followUpRecommended,
      followUpDate,
      labTestsRecommended,
      dietaryAdvice,
    });

    await notificationService.createPrescriptionNotification(patient, req.user.name);

    return successResponse(res, { prescription }, 'Prescription created successfully.', 201);
  } catch (err) {
    next(err);
  }
};

exports.getPrescriptions = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const filter = {};

    if (req.user.role === 'patient') {
      filter.patient = req.user._id;
    } else if (req.user.role === 'doctor') {
      const Doctor = require('../models/Doctor');
      const doctorProfile = await Doctor.findOne({ userId: req.user._id });
      if (doctorProfile) filter.doctor = doctorProfile._id;
    }

    const [prescriptions, total] = await Promise.all([
      Prescription.find(filter)
        .populate('patient', 'name email')
        .populate({ path: 'doctor', populate: { path: 'userId', select: 'name' } })
        .populate('appointment', 'appointmentId date')
        .sort({ issuedDate: -1 })
        .skip(skip)
        .limit(limit),
      Prescription.countDocuments(filter),
    ]);

    const pagination = createPaginationMeta(total, page, limit);
    return paginatedResponse(res, prescriptions, pagination, 'Prescriptions retrieved.');
  } catch (err) {
    next(err);
  }
};

exports.getPrescriptionById = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'name email age gender bloodGroup')
      .populate({ path: 'doctor', populate: [{ path: 'userId', select: 'name email' }, { path: 'department', select: 'name' }] })
      .populate('appointment', 'appointmentId date timeSlot');

    if (!prescription) {
      return errorResponse(res, 'Prescription not found.', 404);
    }

    return successResponse(res, { prescription }, 'Prescription details retrieved.');
  } catch (err) {
    next(err);
  }
};

exports.downloadPrescription = async (req, res, next) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'name email age gender bloodGroup')
      .populate({ path: 'doctor', populate: [{ path: 'userId', select: 'name' }, { path: 'department', select: 'name' }] })
      .populate('appointment', 'appointmentId date');

    if (!prescription) {
      return errorResponse(res, 'Prescription not found.', 404);
    }

    const prescriptionHtml = generatePrescriptionHtml(prescription);
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename=prescription-${prescription._id}.html`);
    return res.send(prescriptionHtml);
  } catch (err) {
    next(err);
  }
};

function generatePrescriptionHtml(prescription) {
  const medicationsRows = prescription.medications
    .map(
      (med, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${med.name}</td>
      <td>${med.dosage}</td>
      <td>${med.frequency}</td>
      <td>${med.duration}</td>
      <td>${med.instructions || '-'}</td>
    </tr>`
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Prescription - AyuCare Hospital</title>
      <style>
        body { font-family: 'Inter', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; color: #1a1a2e; }
        .header { background: linear-gradient(135deg, #6C4DF6, #8B6FF8); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; }
        .header h1 { margin: 0; } .header p { margin: 5px 0 0; opacity: 0.9; }
        .section { background: #F5F6FA; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
        .section h3 { margin-top: 0; color: #6C4DF6; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #6C4DF6; color: white; }
        .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>AyuCare Hospital</h1>
        <p>Medical Prescription</p>
      </div>
      <div class="section">
        <h3>Patient Information</h3>
        <p><strong>Name:</strong> ${prescription.patient?.name || 'N/A'}</p>
        <p><strong>Age:</strong> ${prescription.patient?.age || 'N/A'} | <strong>Gender:</strong> ${prescription.patient?.gender || 'N/A'} | <strong>Blood Group:</strong> ${prescription.patient?.bloodGroup || 'N/A'}</p>
      </div>
      <div class="section">
        <h3>Doctor Information</h3>
        <p><strong>Doctor:</strong> ${prescription.doctor?.userId?.name || 'N/A'}</p>
        <p><strong>Department:</strong> ${prescription.doctor?.department?.name || 'N/A'}</p>
        <p><strong>Date:</strong> ${new Date(prescription.issuedDate).toLocaleDateString()}</p>
      </div>
      <div class="section">
        <h3>Diagnosis</h3>
        <p>${prescription.diagnosis}</p>
      </div>
      <div class="section">
        <h3>Medications</h3>
        <table>
          <thead><tr><th>#</th><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead>
          <tbody>${medicationsRows}</tbody>
        </table>
      </div>
      ${prescription.notes ? `<div class="section"><h3>Notes</h3><p>${prescription.notes}</p></div>` : ''}
      ${prescription.dietaryAdvice ? `<div class="section"><h3>Dietary Advice</h3><p>${prescription.dietaryAdvice}</p></div>` : ''}
      ${prescription.labTestsRecommended?.length ? `<div class="section"><h3>Recommended Lab Tests</h3><ul>${prescription.labTestsRecommended.map((t) => `<li>${t}</li>`).join('')}</ul></div>` : ''}
      <div class="footer">
        <p>This is a computer-generated prescription from AyuCare Hospital.</p>
        <p>&copy; ${new Date().getFullYear()} AyuCare Hospital. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}
