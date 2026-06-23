const axios = require('axios');
const config = require('../config');
const AnimeMapping = require('../models/AnimeMapping');
const WorkerService = require('./workerService');
const { invalidateCache } = require('../middleware/cache');
const logger = require('../utils/logger');

class MappingService {
  static async getMegapleyId(anilistId) {
    const cached = await AnimeMapping.findByAnilistId(anilistId);
    if (cached) {
      return cached.megapley_id;
    }

    try {
      const videoData = await WorkerService.getVideo(anilistId, 1, 'sub');
      if (videoData && videoData.success && videoData.data && videoData.data.sources) {
        const sourceUrl = videoData.data.sources[0]?.file || '';
        const match = sourceUrl.match(/\/stream\/(\d+)\//);
        if (match) {
          const megapleyId = match[1];
          await AnimeMapping.create(anilistId, megapleyId, `Anime ${anilistId}`);
          await invalidateCache('cache:/api/mapping/*');
          return megapleyId;
        }
      }
      throw new Error('Could not extract megapley ID');
    } catch (error) {
      logger.error(`Mapping error for ${anilistId}:`, error.message);
      throw new Error('Failed to get mapping');
    }
  }

  static async updateMapping(anilistId, megapleyId, title) {
    const mapping = await AnimeMapping.upsert(anilistId, megapleyId, title);
    await invalidateCache('cache:/api/mapping/*');
    await invalidateCache('cache:/api/anime/*');
    return mapping;
  }

  static async getAllMappings(limit = 100, offset = 0) {
    return AnimeMapping.getAll(limit, offset);
  }

  static async deleteMapping(anilistId) {
    const mapping = await AnimeMapping.delete(anilistId);
    await invalidateCache('cache:/api/mapping/*');
    return mapping;
  }
}

module.exports = MappingService;
