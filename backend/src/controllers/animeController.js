const AnilistService = require('../services/anilistService');
const CacheService = require('../services/cacheService');
const { successResponse, errorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

class AnimeController {
  static async getTrending(req, res) {
    try {
      const cacheKey = CacheService.getAnimeKey('trending');
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return successResponse(res, cached.Page.media);
      }

      const data = await AnilistService.getTrending();
      await CacheService.set(cacheKey, data, 3600);
      successResponse(res, data.Page.media);
    } catch (error) {
      errorResponse(res, 'Failed to fetch trending anime', 500, error);
    }
  }

  static async getSeasonal(req, res) {
    try {
      const { season, seasonYear, page = 1, perPage = 20 } = req.query;
      const cacheKey = CacheService.getAnimeKey('seasonal', `${season}:${seasonYear}:${page}:${perPage}`);
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return successResponse(res, cached.Page.media);
      }

      const data = await AnilistService.getSeasonal(season, seasonYear, page, perPage);
      await CacheService.set(cacheKey, data, 3600);
      successResponse(res, data.Page.media);
    } catch (error) {
      errorResponse(res, 'Failed to fetch seasonal anime', 500, error);
    }
  }

  static async search(req, res) {
    try {
      const { q, page = 1, perPage = 20 } = req.query;
      const cacheKey = CacheService.getAnimeKey('search', `${q}:${page}:${perPage}`);
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return successResponse(res, cached.Page);
      }

      const data = await AnilistService.search(q, page, perPage);
      await CacheService.set(cacheKey, data, 1800);
      successResponse(res, data.Page);
    } catch (error) {
      errorResponse(res, 'Failed to search anime', 500, error);
    }
  }

  static async getDetail(req, res) {
    try {
      const { id } = req.params;
      const cacheKey = CacheService.getAnimeKey('detail', id);
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return successResponse(res, cached.Media);
      }

      const data = await AnilistService.getDetail(id);
      await CacheService.set(cacheKey, data, 86400);
      successResponse(res, data.Media);
    } catch (error) {
      errorResponse(res, 'Failed to fetch anime detail', 500, error);
    }
  }

  static async getEpisodes(req, res) {
    try {
      const { id } = req.params;
      const cacheKey = CacheService.getAnimeKey('episodes', id);
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return successResponse(res, cached.Media);
      }

      const data = await AnilistService.getEpisodes(id);
      await CacheService.set(cacheKey, data, 3600);
      successResponse(res, data.Media);
    } catch (error) {
      errorResponse(res, 'Failed to fetch episodes', 500, error);
    }
  }
}

module.exports = AnimeController;
