const HealthRecord = require('../models/HealthRecord');
const MedicalDocument = require('../models/MedicalDocument');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/apiResponse');
const { getPaginationParams, createPaginationMeta } = require('../utils/helpers');
const path = require('path');

exports.getHealthRecords = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const patientId = req.user.role === 'admin' && req.query.patientId ? req.query.patientId : req.user._id;

    const [records, total] = await Promise.all([
      HealthRecord.find({ patient: patientId })
        .sort({ recordDate: -1 })
        .skip(skip)
        .limit(limit),
      HealthRecord.countDocuments({ patient: patientId }),
    ]);

    const pagination = createPaginationMeta(total, page, limit);
    return paginatedResponse(res, records, pagination, 'Health records retrieved.');
  } catch (err) {
    next(err);
  }
};

exports.addHealthRecord = async (req, res, next) => {
  try {
    const record = await HealthRecord.create({
      patient: req.body.patient || req.user._id,
      heartRate: req.body.heartRate,
      bloodPressure: req.body.bloodPressure,
      bloodGlucose: req.body.bloodGlucose,
      bodyWeight: req.body.bodyWeight,
      bodyTemperature: req.body.bodyTemperature,
      oxygenSaturation: req.body.oxygenSaturation,
      allergies: req.body.allergies,
      chronicConditions: req.body.chronicConditions,
      notes: req.body.notes,
      recordedBy: req.user._id,
    });

    return successResponse(res, { record }, 'Health record added successfully.', 201);
  } catch (err) {
    next(err);
  }
};

exports.getLatestVitals = async (req, res, next) => {
  try {
    const patientId = req.params.patientId || req.user._id;
    const record = await HealthRecord.findOne({ patient: patientId })
      .sort({ recordDate: -1 });

    return successResponse(res, { vitals: record }, 'Latest vitals retrieved.');
  } catch (err) {
    next(err);
  }
};

exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'Please upload a file.', 400);
    }

    const document = await MedicalDocument.create({
      patient: req.user._id,
      title: req.body.title || req.file.originalname,
      description: req.body.description || '',
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileType: path.extname(req.file.originalname).slice(1).toLowerCase(),
      fileSize: req.file.size,
      category: req.body.category || 'other',
      tags: req.body.tags ? req.body.tags.split(',').map((t) => t.trim()) : [],
    });

    return successResponse(res, { document }, 'Document uploaded successfully.', 201);
  } catch (err) {
    next(err);
  }
};

exports.getDocuments = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query);
    const filter = { patient: req.user._id, isArchived: false };
    if (req.query.category) filter.category = req.query.category;

    const [documents, total] = await Promise.all([
      MedicalDocument.find(filter)
        .sort({ uploadDate: -1 })
        .skip(skip)
        .limit(limit),
      MedicalDocument.countDocuments(filter),
    ]);

    const pagination = createPaginationMeta(total, page, limit);
    return paginatedResponse(res, documents, pagination, 'Documents retrieved.');
  } catch (err) {
    next(err);
  }
};

exports.downloadDocument = async (req, res, next) => {
  try {
    const document = await MedicalDocument.findById(req.params.id);
    if (!document) {
      return errorResponse(res, 'Document not found.', 404);
    }

    if (document.patient.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Not authorized to access this document.', 403);
    }

    const filePath = path.join(process.cwd(), document.fileUrl);
    return res.download(filePath, document.fileName);
  } catch (err) {
    next(err);
  }
};

exports.deleteDocument = async (req, res, next) => {
  try {
    const document = await MedicalDocument.findById(req.params.id);
    if (!document) {
      return errorResponse(res, 'Document not found.', 404);
    }

    if (document.patient.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return errorResponse(res, 'Not authorized to delete this document.', 403);
    }

    document.isArchived = true;
    await document.save();

    return successResponse(res, null, 'Document deleted successfully.');
  } catch (err) {
    next(err);
  }
};
