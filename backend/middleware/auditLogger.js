const AuditLog = require('../models/AuditLog');

const auditLogger = (action, resource) => {
  return async (req, res, next) => {
    const originalSend = res.send;

    res.send = function (body) {
      res.send = originalSend;

      const logEntry = {
        user: req.user?._id || null,
        userName: req.user?.name || 'Anonymous',
        action,
        resource,
        resourceId: req.params.id || '',
        details: `${req.method} ${req.originalUrl}`,
        ip: req.ip || req.connection?.remoteAddress || '',
        userAgent: req.headers['user-agent'] || '',
        statusCode: res.statusCode,
        category: getCategory(action),
      };

      AuditLog.create(logEntry).catch((err) => {
        console.error('Audit log creation failed:', err.message);
      });

      return res.send(body);
    };

    next();
  };
};

function getCategory(action) {
  const securityActions = ['LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGE', 'PASSWORD_RESET', 'ROLE_CHANGE'];
  const accessActions = ['READ', 'DOWNLOAD', 'EXPORT'];
  const systemActions = ['REGISTER'];

  if (securityActions.includes(action)) return 'security';
  if (accessActions.includes(action)) return 'access';
  if (systemActions.includes(action)) return 'system';
  return 'data';
}

const logSecurityEvent = async (userId, userName, action, details, req) => {
  try {
    await AuditLog.create({
      user: userId,
      userName: userName || 'Unknown',
      action,
      resource: 'system',
      details,
      ip: req?.ip || '',
      userAgent: req?.headers?.['user-agent'] || '',
      category: 'security',
    });
  } catch (err) {
    console.error('Security audit log failed:', err.message);
  }
};

module.exports = { auditLogger, logSecurityEvent };
