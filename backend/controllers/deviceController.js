const { getDevices } = require('../services/mqttService');

exports.getDevices = (req, res) => {
    const devices = getDevices();
    res.json({
        success: true,
        devices: devices
    });
};

exports.getDevice = (req, res) => {
    const node = parseInt(req.params.node);
    const devices = getDevices();
    const device = devices.find(d => d.node === node);
    
    if (device) {
        res.json({
            success: true,
            device: device
        });
    } else {
        res.status(404).json({
            success: false,
            error: 'Device not found'
        });
    }
};

exports.getGatewayStatus = (req, res) => {
    const devices = getDevices();
    res.json({
        success: true,
        connected: true,
        devices: devices,
        count: devices.length
    });
};