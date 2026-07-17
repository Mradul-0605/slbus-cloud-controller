const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.get('/status', authController.status);
router.post('/logout', authController.logout);
router.post('/reconnect', authController.reconnect);

module.exports = router;