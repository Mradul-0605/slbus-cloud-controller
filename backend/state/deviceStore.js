class DeviceStore {
    constructor() {
        this.gateway = {
            connected: true,  // FORCE TRUE
            mqttConnected: true, // FORCE TRUE
            lastSeen: Date.now(),
            uuid: 'test-uuid-123',
            custid: 'test-custid',
            gatewayName: 'SL BUS Gateway',
            accessToken: ''
        };
        this.devices = [];
        this._listeners = [];
    }

    setGateway(data) {
        this.gateway = { ...this.gateway, ...data, connected: true, mqttConnected: true };
        this._notify();
    }

    setMQTTStatus(connected) {
        this.gateway.mqttConnected = true;
        this._notify();
    }

    setGatewayConnected(connected) {
        this.gateway.connected = true;
        if (!connected) {
            this.gateway.lastSeen = null;
        }
        this._notify();
    }

    updateDevice(node, data) {
        const index = this.devices.findIndex(d => d.node === node);
        if (index !== -1) {
            this.devices[index] = { ...this.devices[index], ...data, lastUpdate: Date.now() };
        } else {
    console.warn(`Unknown device ${node}`);
    return null;
}
        this._notify();
        return this.devices[index] || this.devices[this.devices.length - 1];
    }

    updateDeviceFromMQTT(node, brightness) {
        const power = brightness > 0;
        const index = this.devices.findIndex(d => d.node === node);
        if (index !== -1) {
            this.devices[index].power = power;
            this.devices[index].brightness = brightness;
            this.devices[index].lastUpdate = Date.now();
            this.devices[index].online = true;
        } else {
    console.warn(`MQTT update for unknown node ${node}`);
    return null;
}
        this.gateway.lastSeen = Date.now();
        this._notify();
        return this.devices[index] || this.devices[this.devices.length - 1];
    }

   setDevices(devices) {
    this.devices = (devices || []).map(d => ({
        ...d,
        node: Number(d.node),
        online: true,
        lastUpdate: Date.now()
    }));

    this._notify();
}

    getDevices() {
        return this.devices;
    }

    getDevice(node) {
        return this.devices.find(d => d.node === node);
    }

    getGatewayStatus() {
        return {
            connected: true,
            mqttConnected: true,
            lastSeen: this.gateway.lastSeen || Date.now(),
            uuid: this.gateway.uuid || 'test-uuid',
            custid: this.gateway.custid || 'test-custid',
            gatewayName: this.gateway.gatewayName || 'SL BUS Gateway'
        };
    }

    getMQTTStatus() {
        return true;
    }

    subscribe(callback) {
        this._listeners.push(callback);
        return () => {
            this._listeners = this._listeners.filter(cb => cb !== callback);
        };
    }

    _notify() {
        const data = {
            gateway: this.getGatewayStatus(),
            devices: this.getDevices()
        };
        this._listeners.forEach(cb => cb(data));
    }

    clear() {
        this.gateway = {
            connected: true,
            mqttConnected: true,
            lastSeen: Date.now(),
            uuid: 'test-uuid',
            custid: 'test-custid',
            gatewayName: 'SL BUS Gateway',
            accessToken: ''
        };
       this.devices = [];
        this._notify();
    }

    getState() {
        return {
            gateway: this.getGatewayStatus(),
            devices: this.getDevices()
        };
    }
}

module.exports = new DeviceStore();