import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

let socket = null;

export function connectSocket() {
    if (socket && socket.connected) {
        return socket;
    }

    socket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000
    });

    socket.on('connect', () => {
        console.log('✅ Socket.IO connected');
    });

    socket.on('disconnect', () => {
        console.log('❌ Socket.IO disconnected');
    });

    socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
    });

    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

export function getSocket() {
    return socket;
}

export default { connectSocket, disconnectSocket, getSocket };