const WorkerService = require('../services/workerService');
const CacheService = require('../services/cacheService');
const { successResponse, errorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

class VideoController {
  static async getVideo(req, res) {
    try {
      const { id, ep, type } = req.params;
      const cacheKey = CacheService.getVideoKey(id, ep, type);
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return successResponse(res, cached);
      }

      const data = await WorkerService.getVideo(id, ep, type);
      await CacheService.set(cacheKey, data, 3600);
      successResponse(res, data);
    } catch (error) {
      errorResponse(res, 'Failed to fetch video', 500, error);
    }
  }

  static async streamVideo(req, res) {
    try {
      const { url, referer } = req.query;
      if (!url) {
        return res.status(400).json({ success: false, message: 'URL is required' });
      }

      const stream = await WorkerService.proxyVideo(url, referer);
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
      stream.pipe(res);
    } catch (error) {
      logger.error('Stream error:', error);
      if (!res.headersSent) {
        errorResponse(res, 'Failed to stream video', 500, error);
      }
    }
  }
}

module.exports = VideoController;
