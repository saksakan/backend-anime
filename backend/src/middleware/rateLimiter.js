const rateLimit = require('express-rate-limit');
const RedisStore = require('express-rate-limit-redis');
const redisClient = require('../config/redis');
const config = require('../config');
const logger = require('../utils/logger');

const createRateLimiter = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    store: new RedisStore({ client: redisClient }),
    windowMs: windowMs,
    max: max,
    message: {
      success: false,
      message: message || 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    skip: (req) => req.path === '/health',
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip} on path: ${req.path}`);
      res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later.',
      });
    },
  });
};

const apiLimiter = createRateLimiter(
  config.rateLimitWindowMs,
  config.rateLimitMaxRequests,
  'API rate limit exceeded. Please try again later.'
);

const videoLimiter = createRateLimiter(
  config.rateLimitWindowMs,
  15,
  'Video request rate limit exceeded. Please try again later.'
);

const searchLimiter = createRateLimiter(
  config.rateLimitWindowMs,
  20,
  'Search rate limit exceeded. Please try again later.'
);

module.exports = {
  apiLimiter,
  videoLimiter,
  searchLimiter,
  createRateLimiter,
};
