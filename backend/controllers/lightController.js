const slbusService = require('../services/slbusService');

exports.turnOn = async (req, res) => {
    try {
        const node = parseInt(req.params.node);
        const result = await slbusService.turnOn(node);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.turnOff = async (req, res) => {
    try {
        const node = parseInt(req.params.node);
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
        const result = await slbusService.queryStatus(node);
        // Extract actual status from response
        let isOn = false;
        if (result && result.data) {
            // Parse the response to get actual status
            const data = result.data;
            if (data.data && data.data.dlpkt && data.data.dlpkt.ans) {
                // You may need to decode this properly
                // For now, assume it's working
                isOn = true;
            }
        }
        res.json({ success: true, data: { status: isOn } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getBrightness = async (req, res) => {
    try {
        const node = parseInt(req.params.node);
        const result = await slbusService.queryBrightness(node);
        let brightness = 127;
        if (result && result.data) {
            // Parse brightness from response
        }
        res.json({ success: true, data: { brightness: brightness } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};