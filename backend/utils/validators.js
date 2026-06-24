const validators = {
  isValidEmail: (email) => {
    const re = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(String(email).toLowerCase());
  },

  isValidPassword: (password) => {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    return re.test(password);
  },

  isValidPhone: (phone) => {
    const re = /^[+]?[\d\s()-]{7,20}$/;
    return re.test(phone);
  },

  isValidDate: (dateString) => {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  },

  isFutureDate: (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return date >= now;
  },

  isValidObjectId: (id) => {
    return /^[0-9a-fA-F]{24}$/.test(id);
  },

  isValidTimeSlot: (time) => {
    const re = /^([01]\d|2[0-3]):([0-5]\d)\s?(AM|PM)?$/i;
    return re.test(time);
  },

  sanitizeString: (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>]/g, '').trim();
  },

  isValidRating: (rating) => {
    const num = Number(rating);
    return Number.isFinite(num) && num >= 1 && num <= 5;
  },
};

module.exports = { validators };
