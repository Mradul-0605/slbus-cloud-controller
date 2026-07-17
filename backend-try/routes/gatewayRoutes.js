const express = require('express');
const router = express.Router();
const gatewayService = require('../services/gatewayService');

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }

    const result = await gatewayService.login(email, password);
    
    if (result.success) {
      const status = gatewayService.getStatus();
      res.json({
        success: true,
        gateway: {
          connected: true,
          uuid: result.uuid,
          gatewayName: status.gatewayName,
          deviceCount: result.deviceCount,
          groupCount: result.groupCount
        }
      });
    } else {
      res.status(401).json({
        success: false,
        error: result.error || 'Login failed'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Status endpoint
router.get('/status', (req, res) => {
  const status = gatewayService.getStatus();
  res.json({
    success: true,
    ...status
  });
});

// Logout endpoint
router.post('/logout', (req, res) => {
  gatewayService.logout();
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Reconnect endpoint
router.post('/reconnect', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }

    const result = await gatewayService.login(email, password);
    
    if (result.success) {
      const status = gatewayService.getStatus();
      res.json({
        success: true,
        connected: true,
        gatewayName: status.gatewayName,
        uuid: result.uuid,
        deviceCount: result.deviceCount
      });
    } else {
      res.status(401).json({
        success: false,
        error: result.error || 'Reconnection failed'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;