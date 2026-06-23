const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

class WorkerService {
  static async getVideo(id, episode, type) {
    try {
      const url = `${config.workerUrl}/${id}/${episode}/${type}`;
      const response = await axios.get(url, {
        timeout: config.workerTimeout,
        headers: {
          'Accept': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      logger.error(`Worker error for video ${id}/${episode}/${type}:`, error.message);
      if (error.code === 'ECONNABORTED') {
        throw new Error('Worker request timeout');
      }
      throw new Error('Failed to fetch video from worker');
    }
  }

  static async proxyM3U8(url, referer) {
    try {
      const response = await axios.get(`${config.workerUrl}/proxy/m3u8`, {
        params: { url, referer },
        timeout: config.workerTimeout,
        responseType: 'text',
      });
      return response.data;
    } catch (error) {
      logger.error('Worker proxy m3u8 error:', error.message);
      throw new Error('Failed to proxy m3u8');
    }
  }

  static async proxyVideo(url, referer) {
    try {
      const response = await axios.get(`${config.workerUrl}/proxy/video`, {
        params: { url, referer },
        timeout: config.workerTimeout,
        responseType: 'stream',
      });
      return response;
    } catch (error) {
      logger.error('Worker proxy video error:', error.message);
      throw new Error('Failed to proxy video');
    }
  }

  static async proxySubtitle(url, referer) {
    try {
      const response = await axios.get(`${config.workerUrl}/proxy/subtitle`, {
        params: { url, referer },
        timeout: config.workerTimeout,
        responseType: 'text',
      });
      return response.data;
    } catch (error) {
      logger.error('Worker proxy subtitle error:', error.message);
      throw new Error('Failed to proxy subtitle');
    }
  }

  static async checkHealth() {
    try {
      const response = await axios.get(`${config.workerUrl}/health`, {
        timeout: 5000,
      });
      return response.data;
    } catch (error) {
      logger.error('Worker health check failed:', error.message);
      return { status: 'unhealthy', error: error.message };
    }
  }
}

module.exports = WorkerService;
