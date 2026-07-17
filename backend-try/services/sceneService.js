const db = require('../database/postgres.db');
const { v4: uuidv4 } = require('uuid');

class SceneService {
  async createScene(sceneData) {
    const sceneId = `scene_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    const newScene = {
      sceneId,
      sceneName: sceneData.name,
      groupId: sceneData.groupId,
      groupName: sceneData.groupName || '',
      nodes: sceneData.nodes || []
    };
    
    return await db.createScene(newScene);
  }

  async getAllScenes() {
    return await db.getAllScenes();
  }

  async getScene(sceneId) {
    return await db.getScene(sceneId);
  }

  async updateScene(sceneId, sceneData) {
    return await db.updateScene(sceneId, sceneData);
  }

  async deleteScene(sceneId) {
    return await db.deleteScene(sceneId);
  }

  async executeScene(sceneId) {
    const nodes = await db.executeScene(sceneId);
    return nodes;
  }

  async saveCurrentState(sceneName, groupId, devices) {
    const groupDevices = devices.filter(d => d.groupId === groupId);
    
    const nodes = groupDevices.map(device => ({
      node: device.node,
      value: device.power ? device.brightness : 0,
      temperature: device.temperature || 4000,
      state: device.power ? 'on' : 'off'
    }));
    
    return await this.createScene({
      name: sceneName,
      groupId: groupId,
      groupName: groupDevices[0]?.groupName || '',
      nodes: nodes
    });
  }
}

module.exports = new SceneService();