import { io } from 'socket.io-client'

const SOCKET_URL = 'https://slbus-backend.onrender.com' || 'http://localhost:5000'

class SocketManager {
  constructor() {
    this.socket = null
    this.listeners = new Map()
  }

  connect() {
    if (this.socket?.connected) {
      console.log('Socket already connected')
      return this.socket
    }

    console.log('🔌 Connecting to socket:', SOCKET_URL)
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    this.socket.on('connect', () => {
      console.log('✅ Socket connected')
    })

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected')
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  on(event, callback) {
    if (!this.socket) this.connect()
    this.socket.on(event, callback)
    this.listeners.set(event, callback)
  }

  off(event) {
    if (this.socket) {
      this.socket.off(event, this.listeners.get(event))
      this.listeners.delete(event)
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data)
    }
  }
}

export const socketManager = new SocketManager()
export default socketManager