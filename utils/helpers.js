const { PAGINATION } = require('./constants');

const getPaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    Math.max(1, parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT),
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const createPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  return timeStr;
};

const generateAppointmentId = (count) => {
  return `AYU-${String(count + 1001).padStart(4, '0')}`;
};

const getSortOptions = (query) => {
  const sortField = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  return { [sortField]: sortOrder };
};

const getFilterQuery = (query, allowedFields) => {
  const filter = {};
  allowedFields.forEach((field) => {
    if (query[field] !== undefined && query[field] !== '') {
      filter[field] = query[field];
    }
  });
  return filter;
};

const buildSearchQuery = (searchTerm, fields) => {
  if (!searchTerm) return {};
  const regex = new RegExp(searchTerm, 'i');
  return { $or: fields.map((field) => ({ [field]: regex })) };
};

const calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};

module.exports = {
  getPaginationParams,
  createPaginationMeta,
  formatDate,
  formatTime,
  generateAppointmentId,
  getSortOptions,
  getFilterQuery,
  buildSearchQuery,
  calculateAge,
};
