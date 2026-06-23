const express = require('express');
const router = express.Router();
const AnimeController = require('../controllers/animeController');
const { apiLimiter, searchLimiter } = require('../middleware/rateLimiter');
const { animeSearchValidation, animeIdValidation } = require('../middleware/validator');
const { cacheMiddleware } = require('../middleware/cache');

router.get('/trending', apiLimiter, cacheMiddleware(3600), AnimeController.getTrending);

router.get('/seasonal', apiLimiter, cacheMiddleware(3600), AnimeController.getSeasonal);

router.get('/search', searchLimiter, animeSearchValidation, cacheMiddleware(1800), AnimeController.search);

router.get('/:id', apiLimiter, animeIdValidation, cacheMiddleware(86400), AnimeController.getDetail);

router.get('/:id/episodes', apiLimiter, animeIdValidation, cacheMiddleware(3600), AnimeController.getEpisodes);

module.exports = router;
