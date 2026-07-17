const deviceStore = require('../state/deviceStore');
const { slbusService } = require('./slbusService');
const { mqttService } = require('./mqttService');

class GatewayService {
  constructor() {
    this._initialized = false;
  }

  async initialize() {
    if (this._initialized) return;
    await mqttService.init();
    this._initialized = true;
  }

  async login(email, password) {
    try {
      deviceStore.clear();
      
      const result = await slbusService.login(email, password);
      
      if (!result.success) {
        return result;
      }

      const gateway = deviceStore.getGateway();
      if (gateway.custid && gateway.uuid) {
        mqttService.subscribe(gateway.custid, gateway.uuid);
      }

      deviceStore.setGatewayConnected(true);
      
      return result;
    } catch (error) {
      console.error('Gateway login error:', error);
      deviceStore.setGatewayConnected(false);
      return { success: false, error: error.message };
    }
  }

  async logout() {
    deviceStore.clear();
    mqttService.disconnect();
  }

  // Control a specific device by node AND group
  async controlDevice(node, groupId, action, value) {
    try {
      const device = deviceStore.getDevice(node, groupId);
      if (!device) {
        throw new Error(`Device ${node} in group ${groupId} not found`);
      }

      let updates = {};
      let commandPromise = null;

      switch (action) {
        case 'power':
          updates.power = value;
          commandPromise = value 
            ? slbusService.turnOn(node)
            : slbusService.turnOff(node);
          break;
        case 'brightness':
          updates.brightness = value;
          commandPromise = slbusService.setBrightness(node, value);
          break;
        case 'temperature':
          updates.temperature = value;
          commandPromise = slbusService.setTemperature(node, value);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      // Update ONLY this specific device instance
      deviceStore.updateDevice(node, groupId, updates);

      const result = await commandPromise;
      
      return { success: true, data: result };
    } catch (error) {
      console.error('Device control error:', error);
      return { success: false, error: error.message };
    }
  }

  // Control ALL devices with same node (across all groups)
async controlAllDevices(node, action, value) {
  try {
    const devices = deviceStore.getDevices().filter(d => d.node === node);
    if (devices.length === 0) {
      throw new Error(`Device ${node} not found`);
    }

    let updates = {};
    let commandPromise = null;

    switch (action) {
      case 'power':
        updates.power = value;
        commandPromise = value 
          ? slbusService.turnOn(node)
          : slbusService.turnOff(node);
        break;
      case 'brightness':
        updates.brightness = value;
        commandPromise = slbusService.setBrightness(node, value);
        break;
      case 'temperature':
        updates.temperature = value;
        commandPromise = slbusService.setTemperature(node, value);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    // Update ALL instances of this device
    deviceStore.updateAllDeviceInstances(node, updates);

    const result = await commandPromise;
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Device control error:', error);
    return { success: false, error: error.message };
  }
}

  getStatus() {
    return deviceStore.getStatus();
  }

  getDevices() {
    return deviceStore.getDevices();
  }

  getDevice(node, groupId) {
    return deviceStore.getDevice(node, groupId);
  }

  getDevicesByGroup(groupId) {
    return deviceStore.getDevicesByGroup(groupId);
  }

  getGroups() {
    return deviceStore.getGroups();
  }

  getScenes() {
    return deviceStore.getScenes();
  }

  getSensors() {
    return deviceStore.getSensors();
  }
}

module.exports = new GatewayService();