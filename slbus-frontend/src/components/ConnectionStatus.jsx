import React, { useState, useEffect } from 'react'
import socketManager from '../socket/socket'

const ConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socket = socketManager.connect()
    
    const handleConnect = () => setIsConnected(true)
    const handleDisconnect = () => setIsConnected(false)

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)

    setIsConnected(socket.connected)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
    }
  }, [])

  return (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${
        isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
      }`} />
      <span className="text-xs text-gray-400 hidden sm:inline">
        {isConnected ? 'Online' : 'Offline'}
      </span>
    </div>
  )
}

export default ConnectionStatus