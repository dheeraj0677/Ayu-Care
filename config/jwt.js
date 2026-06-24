module.exports = {
  secret: process.env.JWT_SECRET || 'ayucare_default_secret',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'ayucare_default_refresh_secret',
  expiresIn: process.env.JWT_EXPIRE || '7d',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
  issuer: 'ayucare-hospital',
  audience: 'ayucare-users',
};
