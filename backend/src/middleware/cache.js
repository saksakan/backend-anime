const redisClient = require('../config/redis');
const logger = require('../utils/logger');

const cacheMiddleware = (duration) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl || req.url}`;

    try {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        logger.debug(`Cache hit for: ${key}`);
        return res.json(JSON.parse(cachedData));
      }

      logger.debug(`Cache miss for: ${key}`);
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        redisClient.setEx(key, duration, JSON.stringify(body)).catch((err) => {
          logger.error('Redis cache set error:', err);
        });
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

const invalidateCache = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Invalidated ${keys.length} cache keys matching: ${pattern}`);
    }
  } catch (error) {
    logger.error('Cache invalidation error:', error);
  }
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
};
