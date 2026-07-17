const deviceStore = require('../state/deviceStore');

let io = null;

function initializeSocket(ioInstance) {
    io = ioInstance;
    
    io.on('connection', (socket) => {
        console.log('Socket.IO client connected:', socket.id);
        
        // Send initial state
        socket.emit('initial_state', deviceStore.getState());
        
        // Subscribe to device updates
        const unsubscribe = deviceStore.subscribe((data) => {
            socket.emit('state_update', data);
        });
        
        socket.on('disconnect', () => {
            console.log('Socket.IO client disconnected:', socket.id);
            unsubscribe();
        });
        
        socket.on('ping', () => {
            socket.emit('pong', { timestamp: Date.now() });
        });
    });
    
    return io;
}

function getIO() {
    return io;
}

function emitUpdate(data) {
    if (io) {
        io.emit('device_update', data);
    }
}

module.exports = {
    initializeSocket,
    getIO,
    emitUpdate
};