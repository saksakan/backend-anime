const { body, param, query, validationResult } = require('express-validator');
const mongoSanitize = require('mongo-sanitize');
const logger = require('../utils/logger');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation error:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

const sanitizeBody = (req, res, next) => {
  if (req.body) {
    req.body = mongoSanitize(req.body);
  }
  next();
};

const sanitizeParams = (req, res, next) => {
  if (req.params) {
    req.params = mongoSanitize(req.params);
  }
  next();
};

const sanitizeQuery = (req, res, next) => {
  if (req.query) {
    req.query = mongoSanitize(req.query);
  }
  next();
};

const animeSearchValidation = [
  query('q')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  query('page')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Page must be between 1 and 100'),
  query('perPage')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Per page must be between 1 and 50'),
  sanitizeQuery,
  validate,
];

const animeIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid anime ID'),
  sanitizeParams,
  validate,
];

const mappingValidation = [
  param('anilistId')
    .isInt({ min: 1 })
    .withMessage('Invalid AniList ID'),
  sanitizeParams,
  validate,
];

const videoValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid anime ID'),
  param('ep')
    .isInt({ min: 1 })
    .withMessage('Invalid episode number'),
  param('type')
    .isIn(['sub', 'dub'])
    .withMessage('Type must be sub or dub'),
  sanitizeParams,
  validate,
];

const proxyValidation = [
  query('url')
    .isURL()
    .withMessage('Valid URL is required'),
  query('referer')
    .optional()
    .isURL()
    .withMessage('Valid referer URL is required'),
  sanitizeQuery,
  validate,
];

module.exports = {
  validate,
  sanitizeBody,
  sanitizeParams,
  sanitizeQuery,
  animeSearchValidation,
  animeIdValidation,
  mappingValidation,
  videoValidation,
  proxyValidation,
};
