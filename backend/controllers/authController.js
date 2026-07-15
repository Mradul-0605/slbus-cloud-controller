const slbusService = require('../services/slbusService');

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
            // Try to check actual connection
            await slbusService.checkConnection();
            const status = slbusService.getStatus();
            
            res.json({
                success: true,
                gateway: {
                    connected: status.connected,
                    uuid: result.uuid,
                    deviceName: status.gateway,
                    devices: result.devices
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
    res.json({
        success: true,
        loggedIn: status.loggedIn,
        connected: status.connected,
        gateway: status.gateway,
        uuid: status.uuid,
        error: status.error || ''
    });
};

exports.reconnect = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const result = await slbusService.reconnect(email, password);
        
        if (result.success) {
            await slbusService.checkConnection();
            const status = slbusService.getStatus();
            
            res.json({
                success: true,
                connected: status.connected,
                loggedIn: status.loggedIn,
                gateway: status.gateway,
                uuid: result.uuid
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

exports.checkConnection = async (req, res) => {
    try {
        const connected = await slbusService.checkConnection();
        const status = slbusService.getStatus();
        res.json({
            success: true,
            connected: connected,
            loggedIn: status.loggedIn,
            gateway: status.gateway,
            error: status.error || ''
        });
    } catch (error) {
        res.json({
            success: true,
            connected: false,
            error: error.message
        });
    }
};