require('express-async-errors');
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('./src/config');
const logger = require('./src/utils/logger');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const { ipFilter } = require('./src/middleware/ipFilter');
const corsMiddleware = require('./src/middleware/cors');
const animeRoutes = require('./src/routes/animeRoutes');
const videoRoutes = require('./src/routes/videoRoutes');
const mappingRoutes = require('./src/routes/mappingRoutes');
const proxyRoutes = require('./src/routes/proxyRoutes');
const indexRoutes = require('./src/routes/index');

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "http:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:", "http:"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://graphql.anilist.co", `http://${config.vpsIp}:8000`, "https:", "http:"],
      frameSrc: ["'self'", "https:", "http:"],
      fontSrc: ["'self'", "https:", "http:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "https:", "http:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(ipFilter);
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url} - IP: ${req.ip} - UA: ${req.get('User-Agent')}`);
  next();
});

app.use('/health', indexRoutes);
app.use('/api/anime', animeRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/mapping', mappingRoutes);
app.use('/proxy', proxyRoutes);

app.get('/', (req, res) => {
  res.json({
    name: 'NimeCore API',
    version: '1.0.0',
    status: 'running',
  });
});

app.use(notFound);
app.use(errorHandler);

const server = app.listen(config.port, () => {
  logger.info(`NimeCore Backend running on port ${config.port} in ${config.nodeEnv} mode`);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

module.exports = app;
