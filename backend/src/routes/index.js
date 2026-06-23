const express = require('express');
const router = express.Router();
const WorkerService = require('../services/workerService');
const db = require('../config/database');
const redisClient = require('../config/redis');
const logger = require('../utils/logger');

router.get('/health', async (req, res) => {
  try {
    const dbStatus = await db.query('SELECT 1').then(() => 'connected').catch(() => 'disconnected');
    const redisStatus = await redisClient.ping().then(() => 'connected').catch(() => 'disconnected');
    const workerStatus = await WorkerService.checkHealth();

    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        redis: redisStatus,
        worker: workerStatus.status || 'unknown',
      },
    };

    const isHealthy = dbStatus === 'connected' && redisStatus === 'connected';
    res.status(isHealthy ? 200 : 503).json(status);
  } catch (error) {
    logger.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

router.get('/', (req, res) => {
  res.json({
    name: 'NimeCore API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      anime: '/api/anime',
      video: '/api/video',
      mapping: '/api/mapping',
      proxy: '/proxy',
    },
  });
});

module.exports = router;
