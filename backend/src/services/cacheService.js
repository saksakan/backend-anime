const redisClient = require('../config/redis');
const logger = require('../utils/logger');

class CacheService {
  static async get(key) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  static async set(key, value, ttl) {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
      logger.debug(`Cache set: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  static async del(key) {
    try {
      await redisClient.del(key);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  static async delPattern(pattern) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
        logger.info(`Deleted ${keys.length} cache keys matching: ${pattern}`);
      }
    } catch (error) {
      logger.error('Cache pattern delete error:', error);
    }
  }

  static getAnimeKey(type, params = '') {
    const baseKeys = {
      trending: 'trending',
      seasonal: `seasonal:${params}`,
      search: `search:${params}`,
      detail: `detail:${params}`,
      episodes: `episodes:${params}`,
    };
    return `anime:${baseKeys[type] || type}:${params}`;
  }

  static getMappingKey(anilistId) {
    return `mapping:${anilistId}`;
  }

  static getVideoKey(id, ep, type) {
    return `video:${id}:${ep}:${type}`;
  }
}

module.exports = CacheService;
