const WorkerService = require('../services/workerService');
const { successResponse, errorResponse } = require('../utils/helpers');
const logger = require('../utils/logger');

class ProxyController {
  static async proxyM3U8(req, res) {
    try {
      const { url, referer } = req.query;
      if (!url) {
        return res.status(400).json({ success: false, message: 'URL is required' });
      }

      const content = await WorkerService.proxyM3U8(url, referer);
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      successResponse(res, { content });
    } catch (error) {
      errorResponse(res, 'Failed to proxy m3u8', 500, error);
    }
  }

  static async proxyVideo(req, res) {
    try {
      const { url, referer } = req.query;
      if (!url) {
        return res.status(400).json({ success: false, message: 'URL is required' });
      }

      const stream = await WorkerService.proxyVideo(url, referer);
      res.setHeader('Content-Type', 'video/mp4');
      stream.pipe(res);
    } catch (error) {
      logger.error('Proxy video error:', error);
      if (!res.headersSent) {
        errorResponse(res, 'Failed to proxy video', 500, error);
      }
    }
  }

  static async proxySubtitle(req, res) {
    try {
      const { url, referer } = req.query;
      if (!url) {
        return res.status(400).json({ success: false, message: 'URL is required' });
      }

      const content = await WorkerService.proxySubtitle(url, referer);
      res.setHeader('Content-Type', 'text/vtt; charset=utf-8');
      res.send(content);
    } catch (error) {
      errorResponse(res, 'Failed to proxy subtitle', 500, error);
    }
  }
}

module.exports = ProxyController;
