const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

router.get('/devices', deviceController.getDevices);
router.get('/devices/:node', deviceController.getDevice);
router.get('/gateway/status', deviceController.getGatewayStatus);

module.exports = router;