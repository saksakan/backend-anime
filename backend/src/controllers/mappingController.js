const MappingService = require('../services/mappingService');
const CacheService = require('../services/cacheService');
const { successResponse, errorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

class MappingController {
  static async getMapping(req, res) {
    try {
      const { anilistId } = req.params;
      const cacheKey = CacheService.getMappingKey(anilistId);
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return successResponse(res, cached);
      }

      const megapleyId = await MappingService.getMegapleyId(anilistId);
      const result = { anilistId, megapleyId };
      await CacheService.set(cacheKey, result, 86400);
      successResponse(res, result);
    } catch (error) {
      errorResponse(res, 'Failed to get mapping', 500, error);
    }
  }

  static async updateMapping(req, res) {
    try {
      const { anilistId, megapleyId, title } = req.body;
      if (!anilistId || !megapleyId) {
        return res.status(400).json({
          success: false,
          message: 'anilistId and megapleyId are required',
        });
      }

      const mapping = await MappingService.updateMapping(anilistId, megapleyId, title);
      successResponse(res, mapping, 201);
    } catch (error) {
      errorResponse(res, 'Failed to update mapping', 500, error);
    }
  }

  static async getAllMappings(req, res) {
    try {
      const { limit = 100, offset = 0 } = req.query;
      const mappings = await MappingService.getAllMappings(limit, offset);
      successResponse(res, mappings);
    } catch (error) {
      errorResponse(res, 'Failed to get mappings', 500, error);
    }
  }

  static async deleteMapping(req, res) {
    try {
      const { anilistId } = req.params;
      const mapping = await MappingService.deleteMapping(anilistId);
      if (!mapping) {
        return res.status(404).json({
          success: false,
          message: 'Mapping not found',
        });
      }
      successResponse(res, { message: 'Mapping deleted successfully' });
    } catch (error) {
      errorResponse(res, 'Failed to delete mapping', 500, error);
    }
  }
}

module.exports = MappingController;
