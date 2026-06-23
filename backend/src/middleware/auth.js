const config = require('../config');
const logger = require('../utils/logger');

const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers[config.apiKeyHeader];

  if (!apiKey) {
    logger.warn(`Missing API key for admin route from IP: ${req.ip}`);
    return res.status(401).json({
      success: false,
      message: 'API key is required',
    });
  }

  if (apiKey !== config.adminApiKey) {
    logger.warn(`Invalid API key attempt from IP: ${req.ip}`);
    return res.status(401).json({
      success: false,
      message: 'Invalid API key',
    });
  }

  next();
};

module.exports = {
  apiKeyAuth,
};
