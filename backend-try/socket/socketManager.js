const deviceStore = require('../state/deviceStore');

class SocketManager {
  constructor() {
    this.io = null;
  }

  initialize(io) {
    this.io = io;
    
    // Subscribe to all DeviceStore events
    deviceStore.on('gateway_updated', (data) => {
      this.io.emit('gateway_updated', data);
    });

    deviceStore.on('devices_updated', (data) => {
      this.io.emit('devices_updated', data);
    });

    deviceStore.on('device_updated', (data) => {
      this.io.emit('device_updated', data);
    });

    deviceStore.on('groups_updated', (data) => {
      this.io.emit('groups_updated', data);
    });

    deviceStore.on('scenes_updated', (data) => {
      this.io.emit('scenes_updated', data);
    });

    deviceStore.on('sensors_updated', (data) => {
      this.io.emit('sensors_updated', data);
    });

    // Handle client connections
    io.on('connection', (socket) => {
      console.log('✅ Client connected:', socket.id);
      
      // Send current state
      const state = deviceStore.getState();
      socket.emit('initial_state', state);

      socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
      });
    });

    console.log('📡 Socket.IO manager initialized');
  }

  getIO() {
    return this.io;
  }
}

module.exports = new SocketManager();