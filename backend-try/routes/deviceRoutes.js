const express = require('express');
const router = express.Router();
const gatewayService = require('../services/gatewayService');
const { slbusService } = require('../services/slbusService');
const sceneService = require('../services/sceneService');

// ============= DEVICE ROUTES =============

// Get all devices
router.get('/devices', (req, res) => {
  const devices = gatewayService.getDevices();
  res.json({
    success: true,
    devices: devices,
    count: devices.length
  });
});

// Get specific device by node
router.get('/devices/:node', (req, res) => {
  const node = parseInt(req.params.node);
  const groupId = req.query.groupId;
  const device = gatewayService.getDevice(node, groupId);
  
  if (device) {
    res.json({
      success: true,
      device: device
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Device not found'
    });
  }
});

// Get devices by group
router.get('/groups/:groupId/devices', (req, res) => {
  const groupId = req.params.groupId;
  const devices = gatewayService.getDevicesByGroup(groupId);
  res.json({
    success: true,
    devices: devices,
    count: devices.length
  });
});

// ============= GROUP ROUTES =============

// Get all groups
router.get('/groups', (req, res) => {
  const groups = gatewayService.getGroups();
  res.json({
    success: true,
    groups: groups,
    count: groups.length
  });
});

// ============= SCENE ROUTES =============

// Get all scenes from database
router.get('/scenes', async (req, res) => {
  try {
    const scenes = await sceneService.getAllScenes();
    res.json({
      success: true,
      scenes: scenes,
      count: scenes.length
    });
  } catch (error) {
    console.error('Get scenes error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get scenes with their keys (available scenes)
router.get('/scenes/available', async (req, res) => {
  try {
    const scenes = await sceneService.getAllScenes();
    const availableScenes = scenes.map(scene => ({
      groupId: scene.group_id,
      groupName: scene.group_name,
      scenes: (scene.nodes || []).map(node => ({
        name: scene.scene_name,
        key: scene.scene_id,
        node: node.node,
        value: node.value,
        temperature: node.temperature,
        state: node.state
      }))
    }));
    
    res.json({
      success: true,
      scenes: availableScenes
    });
  } catch (error) {
    console.error('Get available scenes error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get detailed scenes
router.get('/scenes/detailed', async (req, res) => {
  try {
    const scenes = await sceneService.getAllScenes();
    res.json({
      success: true,
      scenes: scenes.map(scene => ({
        id: scene.scene_id,
        name: scene.scene_name,
        groupId: scene.group_id,
        groupName: scene.group_name,
        nodes: scene.nodes || [],
        createdAt: scene.created_at,
        updatedAt: scene.updated_at
      })),
      count: scenes.length
    });
  } catch (error) {
    console.error('Get detailed scenes error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create a custom scene
router.post('/scene/create', async (req, res) => {
  try {
    const { name, groupId, nodes } = req.body;
    
    if (!name || !groupId) {
      return res.status(400).json({
        success: false,
        error: 'Scene name and groupId are required'
      });
    }
    
    const scene = await sceneService.createScene({
      name: name,
      groupId: groupId,
      nodes: nodes || []
    });
    
    res.json({
      success: true,
      message: `Scene "${name}" created successfully`,
      scene: scene
    });
  } catch (error) {
    console.error('Scene creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Save current device state as a scene
router.post('/scene/save-current', async (req, res) => {
  try {
    const { name, groupId } = req.body;
    
    if (!name || !groupId) {
      return res.status(400).json({
        success: false,
        error: 'Scene name and groupId are required'
      });
    }
    
    const devices = gatewayService.getDevices();
    const scene = await sceneService.saveCurrentState(name, groupId, devices);
    
    res.json({
      success: true,
      message: `Scene "${name}" saved successfully`,
      scene: scene
    });
  } catch (error) {
    console.error('Save scene error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Execute a scene
router.post('/scene/execute', async (req, res) => {
  try {
    const { sceneKey, groupId } = req.body;
    
    if (!sceneKey || !groupId) {
      return res.status(400).json({
        success: false,
        error: 'sceneKey and groupId are required'
      });
    }
    
    // Get scene from database
    const scene = await sceneService.getScene(sceneKey);
    if (!scene) {
      return res.status(404).json({
        success: false,
        error: `Scene ${sceneKey} not found`
      });
    }
    
    // Execute each node in the scene
    const client = slbusService.getClient();
    if (!client) {
      return res.status(401).json({
        success: false,
        error: 'Not logged in. Please login first.'
      });
    }
    
    const results = [];
    for (const node of scene.nodes) {
      try {
        if (node.value > 0) {
          // Turn on with brightness
          await slbusService.setBrightness(node.node, node.value);
          results.push({ node: node.node, action: 'brightness', value: node.value, success: true });
        } else {
          // Turn off
          await slbusService.turnOff(node.node);
          results.push({ node: node.node, action: 'power', value: false, success: true });
        }
        
        // Set temperature if available
        if (node.temperature && node.value > 0) {
          await slbusService.setTemperature(node.node, node.temperature);
        }
      } catch (error) {
        results.push({ node: node.node, error: error.message, success: false });
      }
    }
    
    res.json({
      success: true,
      message: `Scene "${scene.scene_name}" executed successfully`,
      scene: scene.scene_name,
      sceneKey: sceneKey,
      groupId: groupId,
      results: results
    });
  } catch (error) {
    console.error('Scene execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete a scene
router.delete('/scene/delete/:sceneId', async (req, res) => {
  try {
    const { sceneId } = req.params;
    
    const result = await sceneService.deleteScene(sceneId);
    
    res.json({
      success: true,
      message: 'Scene deleted successfully',
      data: result
    });
  } catch (error) {
    console.error('Delete scene error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update a scene
router.put('/scene/update/:sceneId', async (req, res) => {
  try {
    const { sceneId } = req.params;
    const { name, groupId, nodes } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Scene name is required'
      });
    }
    
    const scene = await sceneService.updateScene(sceneId, {
      sceneName: name,
      groupId: groupId,
      nodes: nodes || []
    });
    
    res.json({
      success: true,
      message: `Scene "${name}" updated successfully`,
      scene: scene
    });
  } catch (error) {
    console.error('Update scene error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============= SENSOR ROUTES =============

// Get all sensors
router.get('/sensors', (req, res) => {
  const sensors = gatewayService.getSensors();
  res.json({
    success: true,
    sensors: sensors,
    count: sensors.length
  });
});

// ============= CONTROL ROUTES =============

// Control device
router.post('/device/action', async (req, res) => {
  try {
    const { node, groupId, action, value } = req.body;
    
    if (node === undefined || !action) {
      return res.status(400).json({
        success: false,
        error: 'Node and action required'
      });
    }

    let result;
    if (groupId) {
      result = await gatewayService.controlDevice(node, groupId, action, value);
    } else {
      result = await gatewayService.controlAllDevices(node, action, value);
    }
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Device control error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============= LEGACY ROUTES =============

// Gateway status (legacy)
router.get('/gateway/status', (req, res) => {
  const status = gatewayService.getStatus();
  res.json({
    success: true,
    connected: status.connected,
    devices: gatewayService.getDevices(),
    count: status.deviceCount
  });
});

// ============= DEBUG ROUTES =============

// Debug device types
router.get('/debug/device-types', (req, res) => {
  const devices = gatewayService.getDevices();
  const deviceInfo = devices.map(d => ({
    node: d.node,
    name: d.name,
    groupId: d.groupId,
    groupName: d.groupName,
    nodeType: d.nodeType,
    nodeSubType: d.nodeSubType,
    deviceType: d.deviceType,
    hasBrightness: d.hasBrightness,
    hasTemperature: d.hasTemperature,
    power: d.power,
    brightness: d.brightness,
    temperature: d.temperature
  }));
  
  res.json({
    success: true,
    count: deviceInfo.length,
    devices: deviceInfo
  });
});

module.exports = router;