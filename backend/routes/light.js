const express = require('express');
const router = express.Router();
const lightController = require('../controllers/lightController');

router.post('/light/:node/on', lightController.turnOn);
router.post('/light/:node/off', lightController.turnOff);
router.post('/light/:node/brightness', lightController.setBrightness);
router.post('/light/:node/temp', lightController.setTemperature);
router.get('/light/:node/status', lightController.getStatus);
router.get('/light/:node/brightness', lightController.getBrightness);

module.exports = router;