const logger = require('./logger');

const successResponse = (res, data, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    data,
  });
};

const errorResponse = (res, message, statusCode = 500, error = null) => {
  const response = {
    success: false,
    message,
  };
  if (process.env.NODE_ENV !== 'production' && error) {
    response.error = error.message;
  }
  res.status(statusCode).json(response);
  if (error) {
    logger.error(`Error: ${message}`, { error: error.message, stack: error.stack });
  }
};

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  successResponse,
  errorResponse,
  asyncHandler,
};
