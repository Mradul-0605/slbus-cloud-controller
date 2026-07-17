const slbusService = require('../services/slbusService');
const { getDevices } = require('../services/mqttService');

exports.turnOn = async (req, res) => {
    try {
        const node = parseInt(req.params.node);
        if (isNaN(node) || node < 0) {
            return res.status(400).json({ success: false, error: 'Invalid node' });
        }
        
        const result = await slbusService.turnOn(node);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.turnOff = async (req, res) => {
    try {
        const node = parseInt(req.params.node);
        if (isNaN(node) || node < 0) {
            return res.status(400).json({ success: false, error: 'Invalid node' });
        }
        
        const result = await slbusService.turnOff(node);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.setBrightness = async (req, res) => {
    try {
        const node = parseInt(req.params.node);
        const { level } = req.body;
        
        if (isNaN(node) || node < 0) {
            return res.status(400).json({ success: false, error: 'Invalid node' });
        }
        if (level === undefined || level < 0 || level > 254) {
            return res.status(400).json({ success: false, error: 'Level must be between 0 and 254' });
        }
        
        const result = await slbusService.setBrightness(node, level);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.setTemperature = async (req, res) => {
    try {
        const node = parseInt(req.params.node);
        const { kelvin } = req.body;
        
        if (isNaN(node) || node < 0) {
            return res.status(400).json({ success: false, error: 'Invalid node' });
        }
        if (!kelvin || kelvin < 1000 || kelvin > 10000) {
            return res.status(400).json({ success: false, error: 'Kelvin must be between 1000 and 10000' });
        }
        
        const result = await slbusService.setTemperature(node, kelvin);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getStatus = async (req, res) => {
    try {
        const node = parseInt(req.params.node);
        if (isNaN(node) || node < 0) {
            return res.status(400).json({ success: false, error: 'Invalid node' });
        }
        
        const devices = getDevices();
        const device = devices.find(d => d.node === node);
        
        if (device) {
            res.json({ 
                success: true, 
                data: { 
                    status: device.power,
                    brightness: device.brightness,
                    online: device.online
                } 
            });
        } else {
            res.json({ success: true, data: { status: false, brightness: 0, online: false } });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getBrightness = async (req, res) => {
    try {
        const node = parseInt(req.params.node);
        if (isNaN(node) || node < 0) {
            return res.status(400).json({ success: false, error: 'Invalid node' });
        }
        
        const devices = getDevices();
        const device = devices.find(d => d.node === node);
        
        if (device) {
            res.json({ 
                success: true, 
                data: { 
                    brightness: device.brightness 
                } 
            });
        } else {
            res.json({ success: true, data: { brightness: 0 } });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};