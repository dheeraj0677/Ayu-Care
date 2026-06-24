const Department = require('../models/Department');
const { successResponse, errorResponse } = require('../utils/apiResponse');

exports.getAllDepartments = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    const departments = await Department.find(filter).sort({ name: 1 });
    return successResponse(res, { departments }, 'Departments retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

exports.getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id).populate('doctors');
    if (!department) {
      return errorResponse(res, 'Department not found.', 404);
    }
    return successResponse(res, { department }, 'Department retrieved successfully.');
  } catch (err) {
    next(err);
  }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const { name, description, icon, servicesOffered, contactNumber, location } = req.body;

    const existing = await Department.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existing) {
      return errorResponse(res, 'A department with this name already exists.', 400);
    }

    const department = await Department.create({
      name,
      description,
      icon,
      servicesOffered,
      contactNumber,
      location,
    });

    return successResponse(res, { department }, 'Department created successfully.', 201);
  } catch (err) {
    next(err);
  }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!department) {
      return errorResponse(res, 'Department not found.', 404);
    }

    return successResponse(res, { department }, 'Department updated successfully.');
  } catch (err) {
    next(err);
  }
};

exports.deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!department) {
      return errorResponse(res, 'Department not found.', 404);
    }

    return successResponse(res, null, 'Department deactivated successfully.');
  } catch (err) {
    next(err);
  }
};
