const slbusService = require('../services/slbusService');

exports.getDevices = (req, res) => {
    const devices = slbusService.getDevices();
    res.json({
        success: true,
        devices: devices
    });
};