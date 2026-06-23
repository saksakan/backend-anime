const express = require('express');
const router = express.Router();
const MappingController = require('../controllers/mappingController');
const { apiLimiter } = require('../middleware/rateLimiter');
const { apiKeyAuth, adminIPFilter } = require('../middleware/auth');
const { mappingValidation } = require('../middleware/validator');
const { cacheMiddleware } = require('../middleware/cache');

router.get('/:anilistId', apiLimiter, mappingValidation, cacheMiddleware(86400), MappingController.getMapping);

router.post('/update', apiLimiter, apiKeyAuth, adminIPFilter, MappingController.updateMapping);

router.get('/', apiLimiter, apiKeyAuth, adminIPFilter, MappingController.getAllMappings);

router.delete('/:anilistId', apiLimiter, apiKeyAuth, adminIPFilter, mappingValidation, MappingController.deleteMapping);

module.exports = router;
