const slbusService = require('../services/slbusService');

module.exports = (req, res, next) => {
    const status = slbusService.getStatus();
    if (!status.connected) {
        return res.status(401).json({
            success: false,
            error: 'Not authenticated'
        });
    }
    next();
};