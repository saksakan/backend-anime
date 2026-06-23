const express = require('express');
const router = express.Router();
const VideoController = require('../controllers/videoController');
const { videoLimiter } = require('../middleware/rateLimiter');
const { videoValidation } = require('../middleware/validator');

router.get('/:id/:ep/:type', videoLimiter, videoValidation, VideoController.getVideo);

router.get('/stream', videoLimiter, VideoController.streamVideo);

module.exports = router;
