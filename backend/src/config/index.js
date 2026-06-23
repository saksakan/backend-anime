require('dotenv').config();

const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
  'WORKER_URL',
  'ANILIST_API_URL',
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'ADMIN_API_KEY',
  'CORS_ORIGIN',
  'VPS_IP',
];

const missingEnvVars = requiredEnvVars.filter((varName) => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be at least 32 characters long');
  process.exit(1);
}

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  workerUrl: process.env.WORKER_URL,
  workerTimeout: parseInt(process.env.WORKER_TIMEOUT) || 10000,
  anilistApiUrl: process.env.ANILIST_API_URL,
  jwtSecret: process.env.JWT_SECRET,
  adminApiKey: process.env.ADMIN_API_KEY,
  apiKeyHeader: process.env.API_KEY_HEADER || 'x-api-key',
  corsOrigin: process.env.CORS_ORIGIN.split(','),
  vpsIp: process.env.VPS_IP,
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 30,
};
