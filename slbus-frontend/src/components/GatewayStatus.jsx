import React from 'react'
import { useGateway } from '../hooks/useGateway'

const GatewayStatus = () => {
  const { gatewayName, isConnected } = useGateway()

  return (
    <div className="flex items-center space-x-2 text-sm">
      <span className="text-gray-400 hidden md:inline">Gateway:</span>
      <span className="text-gray-200 font-medium">{gatewayName}</span>
      <span className={`px-2 py-0.5 rounded-full text-xs ${
        isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
      }`}>
        {isConnected ? '🟢 Online' : '🔴 Offline'}
      </span>
    </div>
  )
}

export default GatewayStatus