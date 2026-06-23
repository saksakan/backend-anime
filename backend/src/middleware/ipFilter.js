const logger = require('../utils/logger');

const blacklistedIPs = new Set();
const adminIPs = new Set();

const ipFilter = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;

  if (blacklistedIPs.has(clientIP)) {
    logger.warn(`Blocked request from blacklisted IP: ${clientIP}`);
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  next();
};

const adminIPFilter = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;

  if (blacklistedIPs.has(clientIP)) {
    logger.warn(`Blocked admin request from blacklisted IP: ${clientIP}`);
    return res.status(403).json({
      success: false,
      message: 'Access denied',
    });
  }

  if (adminIPs.size > 0 && !adminIPs.has(clientIP)) {
    logger.warn(`Unauthorized admin access attempt from IP: ${clientIP}`);
    return res.status(403).json({
      success: false,
      message: 'Admin access denied from this IP',
    });
  }

  next();
};

const addToBlacklist = (ip) => {
  blacklistedIPs.add(ip);
  logger.info(`Added IP to blacklist: ${ip}`);
};

const removeFromBlacklist = (ip) => {
  blacklistedIPs.delete(ip);
  logger.info(`Removed IP from blacklist: ${ip}`);
};

const addToAdminWhitelist = (ip) => {
  adminIPs.add(ip);
  logger.info(`Added IP to admin whitelist: ${ip}`);
};

module.exports = {
  ipFilter,
  adminIPFilter,
  addToBlacklist,
  removeFromBlacklist,
  addToAdminWhitelist,
  getBlacklistedIPs: () => Array.from(blacklistedIPs),
  getAdminIPs: () => Array.from(adminIPs),
};
