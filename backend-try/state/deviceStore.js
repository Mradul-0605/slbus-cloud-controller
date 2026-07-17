const EventEmitter = require('events');

class DeviceStore extends EventEmitter {
  constructor() {
    super();
    this._state = {
      gateway: {
        connected: false,
        mqttConnected: false,
        uuid: null,
        custid: null,
        gatewayName: null,
        accessToken: null,
        lastSeen: null
      },
      devices: [],
      groups: [],
      scenes: [],
      sensors: []
    };
    this._listeners = [];
  }

  setGateway(data) {
    this._state.gateway = {
      ...this._state.gateway,
      ...data,
      lastSeen: Date.now()
    };
    this._notify('gateway_updated', this._state.gateway);
  }

  getGateway() {
    return this._state.gateway;
  }

  setGatewayConnected(connected) {
    this._state.gateway.connected = connected;
    this._state.gateway.lastSeen = connected ? Date.now() : this._state.gateway.lastSeen;
    this._notify('gateway_updated', this._state.gateway);
  }

  setMQTTConnected(connected) {
    this._state.gateway.mqttConnected = connected;
    this._notify('gateway_updated', this._state.gateway);
  }

  setDevices(devices) {
    this._state.devices = devices.map(device => ({
      ...device,
      lastUpdate: Date.now(),
      online: true
    }));
    this._notify('devices_updated', this._state.devices);
  }

  getDevices() {
    return this._state.devices;
  }

  getDevice(node, groupId) {
    if (groupId) {
      return this._state.devices.find(d => d.node === node && d.groupId === groupId);
    }
    return this._state.devices.find(d => d.node === node);
  }

  getDevicesByGroup(groupId) {
    return this._state.devices.filter(d => d.groupId === groupId);
  }

  updateDevice(node, groupId, updates) {
    const index = this._state.devices.findIndex(d => d.node === node && d.groupId === groupId);
    if (index === -1) {
      console.warn(`⚠️ Device ${node} in group ${groupId} not found`);
      return null;
    }

    this._state.devices[index] = {
      ...this._state.devices[index],
      ...updates,
      lastUpdate: Date.now()
    };

    this._notify('devices_updated', this._state.devices);
    this._notify('device_updated', this._state.devices[index]);
    return this._state.devices[index];
  }

  updateAllDeviceInstances(node, updates) {
    let updated = false;
    this._state.devices = this._state.devices.map(device => {
      if (device.node === node) {
        updated = true;
        return { ...device, ...updates, lastUpdate: Date.now() };
      }
      return device;
    });
    
    if (updated) {
      this._notify('devices_updated', this._state.devices);
      this._notify('device_updated', this._state.devices.find(d => d.node === node));
    }
    return updated;
  }

  updateDeviceFromMQTT(node, brightness) {
  // Find ALL devices with this node and update them
  let updated = false;
  this._state.devices = this._state.devices.map(device => {
    if (device.node === node) {
      const power = brightness > 0;
      const oldState = { power: device.power, brightness: device.brightness };
      
      device.power = power;
      device.brightness = brightness;
      device.online = true;
      device.lastUpdate = Date.now();
      
      console.log(`🔄 Node ${node} (Group ${device.groupId}): ${oldState.power ? 'ON' : 'OFF'} (${oldState.brightness}) → ${power ? 'ON' : 'OFF'} (${brightness})`);
      updated = true;
    }
    return device;
  });
  
  if (updated) {
    this._notify('devices_updated', this._state.devices);
  }
  return updated;
}

  setGroups(groups) {
    this._state.groups = groups;
    this._notify('groups_updated', this._state.groups);
  }

  getGroups() {
    return this._state.groups;
  }

  setScenes(scenes) {
    this._state.scenes = scenes;
    this._notify('scenes_updated', this._state.scenes);
  }

  getScenes() {
    return this._state.scenes;
  }

  setSensors(sensors) {
    this._state.sensors = sensors;
    this._notify('sensors_updated', this._state.sensors);
  }

  getSensors() {
    return this._state.sensors;
  }

  getState() {
    return this._state;
  }

  getStatus() {
    const gateway = this._state.gateway;
    return {
      connected: gateway.connected,
      mqttConnected: gateway.mqttConnected,
      uuid: gateway.uuid,
      custid: gateway.custid,
      gatewayName: gateway.gatewayName,
      deviceCount: this._state.devices.length,
      groupCount: this._state.groups.length,
      sceneCount: this._state.scenes.length,
      sensorCount: this._state.sensors.length,
      lastSeen: gateway.lastSeen
    };
  }

  clear() {
    this._state = {
      gateway: {
        connected: false,
        mqttConnected: false,
        uuid: null,
        custid: null,
        gatewayName: null,
        accessToken: null,
        lastSeen: null
      },
      devices: [],
      groups: [],
      scenes: [],
      sensors: []
    };
    this._notify('state_cleared', null);
  }

  subscribe(callback) {
    this._listeners.push(callback);
    return () => {
      this._listeners = this._listeners.filter(cb => cb !== callback);
    };
  }

  _notify(event, data) {
    this._listeners.forEach(cb => {
      try {
        cb(event, data);
      } catch (error) {
        console.error('Listener error:', error);
      }
    });
    this.emit(event, data);
  }
}

module.exports = new DeviceStore();