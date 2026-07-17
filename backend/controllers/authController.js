const { slbusService } = require('../services/slbusService');
const { getDevices, subscribeToDevices } = require('../services/mqttService');

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password required'
            });
        }

        const result = await slbusService.login(email, password);
        
        if (result.success) {
            const status = slbusService.getStatus();
            const devices = getDevices();
            
            // Subscribe to MQTT
            if (status.custid && status.uuid) {
                subscribeToDevices(status.custid, status.uuid);
            }
            
            res.json({
                success: true,
                gateway: {
                    connected: true,
                    uuid: result.uuid,
                    deviceName: status.gateway || 'SL BUS Gateway',
                    devices: devices
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
};

exports.status = (req, res) => {
    const status = slbusService.getStatus();
    const devices = getDevices();
    
    res.json({
        success: true,
        connected: status.connected,
        gateway: status.gateway,
        uuid: status.uuid,
        custid: status.custid,
        devices: devices,
        error: ''
    });
};

exports.logout = (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
};

exports.reconnect = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password required'
            });
        }

        const result = await slbusService.login(email, password);
        
        if (result.success) {
            const status = slbusService.getStatus();
            const devices = getDevices();
            
            if (status.custid && status.uuid) {
                subscribeToDevices(status.custid, status.uuid);
            }
            
            res.json({
                success: true,
                connected: true,
                gateway: status.gateway || 'SL BUS Gateway',
                uuid: result.uuid,
                devices: devices
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
};