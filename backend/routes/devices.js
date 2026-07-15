const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

router.get('/devices', deviceController.getDevices);

module.exports = router;