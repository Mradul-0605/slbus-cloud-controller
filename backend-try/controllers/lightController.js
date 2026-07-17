// This file is deprecated. Device control is now handled by gatewayService.
// Keeping for backward compatibility but redirecting.
const gatewayService = require('../services/gatewayService');

exports.turnOn = async (req, res) => {
  try {
    const node = parseInt(req.params.node);
    const result = await gatewayService.controlDevice(node, 'power', true);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.turnOff = async (req, res) => {
  try {
    const node = parseInt(req.params.node);
    const result = await gatewayService.controlDevice(node, 'power', false);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.setBrightness = async (req, res) => {
  try {
    const node = parseInt(req.params.node);
    const { level } = req.body;
    const result = await gatewayService.controlDevice(node, 'brightness', level);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.setTemperature = async (req, res) => {
  try {
    const node = parseInt(req.params.node);
    const { kelvin } = req.body;
    const result = await gatewayService.controlDevice(node, 'temperature', kelvin);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};