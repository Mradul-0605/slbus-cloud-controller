const axios = require('axios');
const deviceStore = require('../state/deviceStore');
const { encodePkt } = require('../utils/encoder');
const { API, NODE_TYPES } = require('../config/constants');

class SLBusClient {
  constructor(email, password) {
    this.email = email;
    this.password = password;
    this.accessToken = null;
    this.uuid = null;
    this.custid = null;
  }

  async login() {
    try {
      console.log('🔐 Logging in to SL BUS...');
      
      const response = await axios.post(API.LOGIN, {
        cmd: {
          login: {
            user: this.email,
            password: this.password,
            devices: 'online'
          }
        }
      });

      const data = response.data;
      
      console.log('\n📋 FULL LOGIN RESPONSE:');
      console.log(JSON.stringify(data, null, 2));
      
      if (!data.login || data.login.status !== 'pass') {
        return { success: false, error: 'Login failed' };
      }

      const dnsList = data.login?.data?.dnsListData || [];
      if (dnsList.length === 0) {
        return { success: false, error: 'No online SL BUS gateway found' };
      }

      const gateway = dnsList[0];
      this.uuid = gateway.uuid || '';
      this.custid = data.login.cid || '';
      
      console.log(`\n✅ Gateway Name: ${gateway.dname || gateway.ipAddress || 'SL BUS Gateway'}`);
      console.log(`✅ UUID: ${this.uuid}`);
      console.log(`✅ Customer ID: ${this.custid}`);

      deviceStore.setGateway({
        connected: true,
        uuid: this.uuid,
        custid: this.custid,
        gatewayName: gateway.dname || gateway.ipAddress || 'SL BUS Gateway'
      });

      // ============= PARSE GROUPS AND DEVICES =============
      const groupList = gateway.groupList || [];
      console.log(`\n📦 Groups Loaded: ${groupList.length}`);
      
      const groups = [];
      const devices = [];
      
      for (const group of groupList) {
        const nodes = group.ns || [];
        groups.push({
          groupId: group.groupId,
          groupName: group.groupName || `Group ${group.groupId}`,
          gk: group.gk,
          nodeCount: nodes.length
        });

        console.log(`\n🔍 Processing group: ${group.groupName || group.groupId} (${nodes.length} nodes)`);
        
        for (const node of nodes) {
          const nodeType = Number(node.nt);
          const nodeSubType = node.nst || null;
          
          // Get device info from mapping
          const deviceInfo = this._getDeviceType(nodeType, nodeSubType);
          
          console.log(`   Node ${node.nk}: ${node.nn || 'Unnamed'} (NT: ${nodeType}, NST: ${nodeSubType}) → ${deviceInfo.type}`);
          
          devices.push({
            node: Number(node.nk),
            name: node.nn || `Node ${node.nk}`,
            nodeType: nodeType,
            nodeSubType: nodeSubType,
            deviceType: deviceInfo.type,
            deviceName: deviceInfo.name,
            hasBrightness: deviceInfo.hasBrightness || false,
            hasTemperature: deviceInfo.hasTemperature || false,
            groupId: group.groupId,
            groupName: group.groupName || `Group ${group.groupId}`,
            power: false,
            brightness: 127,
            temperature: 4000,
            online: true,
            lastUpdate: Date.now()
          });
        }
      }

      console.log(`\n💡 Total Devices Loaded: ${devices.length}`);
      
      // ============= PARSE SCENES =============
      console.log('\n🎬 Looking for scenes in login response...');
      const scenes = this._extractScenesFromLogin(data);
      console.log(`🎬 Scenes Loaded: ${scenes.length}`);
      
      if (scenes.length > 0) {
        scenes.forEach((scene, index) => {
          console.log(`   Scene ${index + 1}: ${scene.sceneName} (ID: ${scene.sceneId})`);
        });
      }

      // ============= PARSE SENSORS =============
      const sensors = this._extractSensorsFromLogin(data);
      console.log(`📊 Sensors Loaded: ${sensors.length}`);

      // Store everything
      deviceStore.setGroups(groups);
      deviceStore.setDevices(devices);
      deviceStore.setScenes(scenes);
      deviceStore.setSensors(sensors);

      // ============= GET ACCESS TOKEN =============
      await this._getAccessToken();
      
      return { 
        success: true, 
        uuid: this.uuid, 
        custid: this.custid,
        deviceCount: devices.length,
        groupCount: groups.length,
        sceneCount: scenes.length,
        sensorCount: sensors.length
      };

    } catch (error) {
      console.error('❌ Login error:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
      deviceStore.setGatewayConnected(false);
      return { success: false, error: error.message };
    }
  }

  // ============= DEVICE TYPE DETECTION =============
  _getDeviceType(nt, nst) {
    // Special case for node type 8 (RGB/Tunable)
    if (nt === 8) {
      if (nst === 'tc') {
        return { 
          type: 'white_tunable', 
          name: 'Tunable White', 
          hasBrightness: true, 
          hasTemperature: true 
        };
      } else if (nst === 'rgb') {
        return { 
          type: 'rgb', 
          name: 'RGB Light', 
          hasBrightness: true, 
          hasTemperature: false 
        };
      }
    }
    
    // Map node types using the constants
    const nodeInfo = NODE_TYPES[nt];
    if (nodeInfo) {
      return {
        type: nodeInfo.type,
        name: nodeInfo.name,
        hasBrightness: nodeInfo.hasBrightness || false,
        hasTemperature: nodeInfo.hasTemperature || false
      };
    }
    
    // Default fallback
    console.warn(`⚠️ Unknown node type: ${nt}, treating as switch`);
    return {
      type: 'switch',
      name: 'Switch',
      hasBrightness: false,
      hasTemperature: false
    };
  }

  // ============= EXTRACT SCENES =============
  _extractScenesFromLogin(loginData) {
    const scenes = [];
    const groups = loginData.login?.data?.dnsListData?.[0]?.groupList || [];
    
    for (const group of groups) {
      // Check for scenes array
      if (group.scenes && Array.isArray(group.scenes)) {
        for (const scene of group.scenes) {
          scenes.push({
            sceneId: scene.sceneId || scene.id || scene.sid || scene.sceneNo,
            sceneName: scene.sceneName || scene.name || `Scene ${scene.sceneId}`,
            sceneType: 'group_scene',
            groupId: group.groupId,
            groupName: group.groupName,
            nodes: this._extractNodesFromScene(scene),
            raw: scene
          });
        }
      }
      
      // Check for sceneList
      if (group.sceneList && Array.isArray(group.sceneList)) {
        for (const scene of group.sceneList) {
          scenes.push({
            sceneId: scene.sceneId || scene.id || scene.sid || scene.sceneNo,
            sceneName: scene.sceneName || scene.name || `Scene ${scene.sceneId}`,
            sceneType: 'group_scene',
            groupId: group.groupId,
            groupName: group.groupName,
            nodes: this._extractNodesFromScene(scene),
            raw: scene
          });
        }
      }
      
      // Check for S0, S1, S2 keys (Configurator format)
      for (const key of Object.keys(group)) {
        if (key.match(/^S\d+$/)) {
          const sceneData = group[key];
          scenes.push({
            sceneId: key,
            sceneName: sceneData.sn || sceneData.sceneName || sceneData.name || `Scene ${key}`,
            sceneType: 'saved_scene',
            groupId: group.groupId,
            groupName: group.groupName,
            sceneKey: sceneData.sk || parseInt(key.replace('S', '')),
            nodes: this._extractNodesFromScene(sceneData),
            raw: sceneData
          });
        }
      }
    }
    
    return scenes;
  }

  _extractNodesFromScene(scene) {
    const nodes = [];
    const possibleNodeFields = ['nodes', 'ns', 'nodeList', 'node'];
    
    for (const field of possibleNodeFields) {
      if (scene[field] && Array.isArray(scene[field])) {
        for (const node of scene[field]) {
          nodes.push({
            node: Number(node.nk || node.node || node.ad || node.id || 0),
            value: Number(node.vl || node.value || 0),
            action: node.action || null
          });
        }
        if (nodes.length > 0) break;
      }
    }
    
    if (nodes.length === 0 && scene.nk !== undefined) {
      nodes.push({
        node: Number(scene.nk || scene.node || 0),
        value: Number(scene.vl || scene.value || 0),
        action: scene.action || null
      });
    }
    
    return nodes;
  }

  // ============= EXTRACT SENSORS =============
  _extractSensorsFromLogin(loginData) {
    const sensors = [];
    const possiblePaths = [
      () => loginData.login?.data?.sensorList,
      () => loginData.login?.data?.dnsListData?.[0]?.sensorList,
      () => loginData.sensors,
      () => loginData.sensorList
    ];

    for (const getSensors of possiblePaths) {
      try {
        const sensorData = getSensors();
        if (sensorData && Array.isArray(sensorData) && sensorData.length > 0) {
          for (const sensor of sensorData) {
            sensors.push({
              sensorId: sensor.sensorId || sensor.id || sensor.sid,
              sensorName: sensor.sensorName || sensor.name || 'Unnamed Sensor',
              sensorType: sensor.sensorType || sensor.type || 'unknown',
              value: sensor.value || 0,
              unit: sensor.unit || null,
              node: sensor.node || null,
              groupId: sensor.groupId || null,
              online: true,
              lastUpdate: Date.now()
            });
          }
          break;
        }
      } catch (error) {
        // Continue to next path
      }
    }
    return sensors;
  }

  // ============= GET ACCESS TOKEN =============
  async _getAccessToken() {
    try {
      const response = await axios.post(API.ACCESS_TOKEN, {
        grant_type: 'smartapp_token',
        user: this.email,
        password: this.password
      });
      
      this.accessToken = response.data.access_token;
      deviceStore.setGateway({ accessToken: this.accessToken });
      console.log('🔑 Access token obtained');
      return this.accessToken;
    } catch (error) {
      console.error('❌ Failed to get access token:', error.message);
      throw new Error('Failed to get access token: ' + error.message);
    }
  }

  // ============= SEND PACKET =============
  async _sendPacket(packet) {
    if (!this.accessToken || !this.uuid) {
      throw new Error('Not authenticated');
    }

    const encoded = encodePkt(packet);
    const payload = {
      cmd: { dlpkt: { fwd: encoded } },
      uuid: this.uuid,
      access_token: this.accessToken
    };

    try {
      const response = await axios.post(API.COMMAND, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Command timeout - gateway not responding');
      }
      throw new Error(`Command failed: ${error.message}`);
    }
  }

  // ============= GROUP ADDRESS HELPER =============
  _getGroupAddress(groupId) {
    const groupMap = {
      'Ga': 0, 'Gb': 2, 'Gc': 4, 'Gd': 6,
      'Ge': 8, 'Gf': 10, 'Gg': 12, 'Gh': 14,
      'Gi': 16, 'Gj': 18, 'Gk': 20, 'Gl': 22,
      'Gm': 24, 'Gn': 26, 'Go': 28, 'Gp': 30
    };
    
    if (typeof groupId === 'string' && groupMap[groupId] !== undefined) {
      return groupMap[groupId];
    }
    if (typeof groupId === 'number') {
      return groupId * 2;
    }
    const num = Number(groupId);
    if (!isNaN(num)) {
      return num * 2;
    }
    console.warn(`⚠️ Unknown group ID: ${groupId}, using 0`);
    return 0;
  }

  // ============= DEVICE CONTROL METHODS =============
  async turnOn(node) {
    const packet = [0, 2, (node * 2) + 1, 5, 0, 0, 0, 120];
    return this._sendPacket(packet);
  }

  async turnOff(node) {
    const packet = [0, 2, (node * 2) + 1, 0, 0, 0, 0, 120];
    return this._sendPacket(packet);
  }

  async setBrightness(node, level) {
    const packet = [0, 2, node * 2, level, 0, 0, 128, 120];
    return this._sendPacket(packet);
  }

  async setTemperature(node, kelvin) {
    const mirek = Math.round(1000000 / kelvin);
    const low = mirek & 0xFF;
    const high = (mirek >> 8) & 0xFF;
    const addr = (node * 2) + 1;

    const packets = [
      [0, 2, 165, 0, 0, 0, 0, 40],
      [0, 2, 165, 0, 0, 0, 0, 120],
      [0, 2, 163, low, 0, 0, 0, 120],
      [0, 2, 195, high, 0, 0, 0, 120],
      [0, 2, 193, 8, 0, 0, 0, 120],
      [0, 2, addr, 231, 0, 0, 0, 120],
      [0, 2, 193, 8, 0, 0, 0, 120],
      [0, 2, addr, 226, 0, 0, 0, 120],
      [0, 2, 161, 0, 0, 0, 0, 40],
      [0, 2, 161, 0, 0, 0, 0, 120]
    ];

    let lastResponse = null;
    for (const pkt of packets) {
      lastResponse = await this._sendPacket(pkt);
    }
    return lastResponse;
  }

  // ============= SCENE METHODS =============
  async executeScene(groupId, sceneKey) {
    try {
      console.log(`🎬 Executing scene: Group ${groupId}, Scene Key ${sceneKey}`);
      const groupAddress = this._getGroupAddress(groupId);
      const packet = [0, 2, groupAddress, sceneKey, 0, 0, 128, 20];
      const result = await this._sendPacket(packet);
      console.log(`✅ Scene executed:`, result);
      return result;
    } catch (error) {
      console.error('❌ Failed to execute scene:', error.message);
      throw error;
    }
  }

  async executeConfiguratorScene(groupId, sceneKey) {
    try {
      console.log(`🎬 Executing Configurator Scene: Group ${groupId}, Scene Key ${sceneKey}`);
      const groupAddress = this._getGroupAddress(groupId);
      const packet = [0, 2, groupAddress, sceneKey, 0, 0, 128, 20];
      console.log(`📤 Sending packet: [${packet.join(', ')}]`);
      const result = await this._sendPacket(packet);
      console.log(`✅ Scene executed successfully`);
      return result;
    } catch (error) {
      console.error('❌ Failed to execute scene:', error.message);
      throw error;
    }
  }

  // ============= SCENE CREATION METHODS =============
  async createCustomScene(sceneData) {
  try {
    console.log(`🎬 Creating custom scene: ${sceneData.name}`);
    console.log(`   Group: ${sceneData.groupId}`);
    console.log(`   Nodes: ${sceneData.nodes ? sceneData.nodes.length : 0}`);
    
    // Format nodes for SL BUS
    const nodes = (sceneData.nodes || []).map(node => ({
      nk: node.nk || node.node || 0,
      vl: node.vl || node.value || 0,
      tp: node.tp || node.temperature || 4000,
      st: node.st || node.state || 'on'
    }));

    const payload = {
      cmd: {
        addScene: {
          sceneName: sceneData.name,
          groupId: sceneData.groupId,
          nodes: nodes
        }
      },
      uuid: this.uuid,
      access_token: this.accessToken
    };

    console.log('📤 Scene creation payload:', JSON.stringify(payload, null, 2));
    
    const response = await axios.post(API.COMMAND, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Custom scene created:', response.data);
    
    // IMPORTANT: After creating, we need to refresh the scene list
    // The scene will be available in the next login or scene fetch
    
    return response.data;
  } catch (error) {
    console.error('❌ Create scene error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

  async saveCurrentStateAsScene(sceneName, groupId) {
    try {
      console.log(`💾 Saving current state as scene: ${sceneName}`);
      
      const devices = deviceStore.getDevices();
      const groupDevices = devices.filter(d => d.groupId === groupId);
      
      const nodes = groupDevices.map(device => ({
        nk: device.node,
        vl: device.power ? device.brightness : 0,
        tp: device.temperature || 4000,
        st: device.power ? 'on' : 'off'
      }));
      
      return await this.createCustomScene({
        name: sceneName,
        groupId: groupId,
        nodes: nodes
      });
    } catch (error) {
      console.error('❌ Save state error:', error.message);
      throw error;
    }
  }

  async deleteScene(sceneId, groupId) {
    try {
      console.log(`🗑️ Deleting scene: ${sceneId}`);
      
      const payload = {
        cmd: {
          deleteScene: {
            sceneId: sceneId,
            groupId: groupId || 0
          }
        },
        uuid: this.uuid,
        access_token: this.accessToken
      };

      const response = await axios.post(API.COMMAND, payload, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('✅ Scene deleted:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Delete scene error:', error.message);
      throw error;
    }
  }
}

// ============= EXPORT =============
const slbusService = {
  _client: null,

  login: async (email, password) => {
    const client = new SLBusClient(email, password);
    const result = await client.login();
    if (result.success) {
      slbusService._client = client;
    }
    return result;
  },

  getClient: () => slbusService._client,

  turnOn: async (node) => {
    if (!slbusService._client) throw new Error('Not logged in');
    return slbusService._client.turnOn(node);
  },

  turnOff: async (node) => {
    if (!slbusService._client) throw new Error('Not logged in');
    return slbusService._client.turnOff(node);
  },

  setBrightness: async (node, level) => {
    if (!slbusService._client) throw new Error('Not logged in');
    return slbusService._client.setBrightness(node, level);
  },

  setTemperature: async (node, kelvin) => {
    if (!slbusService._client) throw new Error('Not logged in');
    return slbusService._client.setTemperature(node, kelvin);
  },

  executeScene: async (groupId, sceneKey) => {
    if (!slbusService._client) throw new Error('Not logged in');
    return slbusService._client.executeScene(groupId, sceneKey);
  },

  executeConfiguratorScene: async (groupId, sceneKey) => {
    if (!slbusService._client) throw new Error('Not logged in');
    return slbusService._client.executeConfiguratorScene(groupId, sceneKey);
  },

  createCustomScene: async (sceneData) => {
    if (!slbusService._client) throw new Error('Not logged in');
    return slbusService._client.createCustomScene(sceneData);
  },

  saveCurrentStateAsScene: async (sceneName, groupId) => {
    if (!slbusService._client) throw new Error('Not logged in');
    return slbusService._client.saveCurrentStateAsScene(sceneName, groupId);
  },

  deleteScene: async (sceneId, groupId) => {
    if (!slbusService._client) throw new Error('Not logged in');
    return slbusService._client.deleteScene(sceneId, groupId);
  }
};

module.exports = { slbusService };