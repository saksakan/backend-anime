const express = require('express');
const router = express.Router();
const ProxyController = require('../controllers/proxyController');
const { videoLimiter } = require('../middleware/rateLimiter');
const { proxyValidation } = require('../middleware/validator');

router.get('/m3u8', videoLimiter, proxyValidation, ProxyController.proxyM3U8);

router.get('/video', videoLimiter, proxyValidation, ProxyController.proxyVideo);

router.get('/subtitle', videoLimiter, proxyValidation, ProxyController.proxySubtitle);

module.exports = router;
