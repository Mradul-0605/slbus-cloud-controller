const deviceStore = require('../state/deviceStore');
const { subscribeAfterLogin } = require('./mqttService');

class GatewayService {
    constructor() {
        this.gatewayInfo = null;
    }

    setGatewayInfo(data) {
        this.gatewayInfo = data;
        deviceStore.setGateway({
            uuid: data.uuid || '',
            custid: data.custid || '',
            gatewayName: data.gatewayName || 'SL BUS Gateway',
            connected: true,
            lastSeen: Date.now()
        });
        
        if (data.devices && data.devices.length > 0) {
            deviceStore.setDevices(data.devices);
        }
        
        // Subscribe to MQTT
        if (data.custid && data.uuid) {
            subscribeAfterLogin(data.custid, data.uuid);
        }
    }

    getGatewayInfo() {
        return deviceStore.getGatewayStatus();
    }

    getDevices() {
        return deviceStore.getDevices();
    }

    getDevice(node) {
        return deviceStore.getDevice(node);
    }

    updateDeviceFromCommand(node, power, brightness) {
        const device = deviceStore.updateDevice(node, {
            power: power,
            brightness: brightness,
            online: true,
            lastUpdate: Date.now()
        });
        
        // Emit via Socket.IO
        if (global.io) {
            global.io.emit('device_update', {
                node: node,
                power: power,
                brightness: brightness,
                timestamp: Date.now(),
                source: 'command'
            });
        }
        
        return device;
    }

    clearGateway() {
        deviceStore.clear();
        this.gatewayInfo = null;
    }
}

module.exports = new GatewayService();