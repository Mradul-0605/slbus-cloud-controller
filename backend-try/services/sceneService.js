const db = require('../database/scenes');

class SceneService {
  // Create a new scene
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

  // Get all scenes
  async getAllScenes() {
    return await db.getAllScenes();
  }

  // Get a scene by ID
  async getScene(sceneId) {
    return await db.getScene(sceneId);
  }

  // Update a scene
  async updateScene(sceneId, sceneData) {
    return await db.updateScene(sceneId, sceneData);
  }

  // Delete a scene
  async deleteScene(sceneId) {
    return await db.deleteScene(sceneId);
  }

  // Execute a scene (get nodes to control)
  async executeScene(sceneId) {
    const nodes = await db.executeScene(sceneId);
    return nodes;
  }

  // Save current device state as scene
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