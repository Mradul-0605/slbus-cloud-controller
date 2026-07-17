import React, { useState } from 'react'
import { useDeviceContext } from '../hooks/useDeviceContext'

const DeviceCard = ({ device }) => {
  const { controlDevice } = useDeviceContext()
  const [isLoading, setIsLoading] = useState(false)
  const [localBrightness, setLocalBrightness] = useState(device.brightness || 0)
  const [localTemperature, setLocalTemperature] = useState(device.temperature || 4000)

  const handleControl = async (action, value) => {
    setIsLoading(true)
    try {
      await controlDevice(device.node, device.groupId, action, value)
      if (action === 'brightness') setLocalBrightness(value)
      if (action === 'temperature') setLocalTemperature(value)
    } finally {
      setIsLoading(false)
    }
  }

  const getIcon = () => {
    const icons = {
      'led': '💡',
      'dimmer': '💡',
      'switch': '🔌',
      'fan': '🌀',
      'ac': '❄️',
      'curtain': '🪟',
      'plug': '🔌',
      'rgb': '🌈',
      'white_tunable': '💡'
    }
    return icons[device.deviceType] || '📱'
  }

  const getDeviceTypeName = () => {
    const names = {
      'led': 'LED Light',
      'dimmer': 'Dimmer',
      'switch': 'Switch',
      'fan': 'Fan',
      'ac': 'AC',
      'curtain': 'Curtain',
      'plug': 'Plug',
      'rgb': 'RGB Light',
      'white_tunable': 'Tunable White'
    }
    return names[device.deviceType] || device.deviceType || 'Device'
  }

  const supportsBrightness = device.hasBrightness || 
    device.deviceType === 'led' || 
    device.deviceType === 'dimmer' || 
    device.deviceType === 'white_tunable' ||
    device.deviceType === 'rgb' ||
    device.nodeType === 6 ||
    device.nodeType === 100 ||
    device.nodeType === 101

  const supportsTemperature = device.hasTemperature ||
    device.deviceType === 'white_tunable' ||
    device.deviceType === 'led' ||
    device.nodeType === 6 ||
    device.nodeType === 100

  return (
    <div className={`glass rounded-xl p-6 card-hover ${
      device.power ? 'border-blue-500/30' : 'border-white/5'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{getIcon()}</span>
          <div>
            <h3 className="font-semibold text-gray-100">{device.name}</h3>
            <p className="text-sm text-gray-400">{device.groupName}</p>
            <p className="text-xs text-gray-500">{getDeviceTypeName()} (Node {device.node})</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          device.power 
            ? 'bg-blue-500/20 text-blue-400' 
            : 'bg-gray-500/20 text-gray-400'
        }`}>
          {device.power ? 'ON' : 'OFF'}
        </span>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => handleControl('power', !device.power)}
          disabled={isLoading}
          className={`w-full py-2 rounded-lg font-medium transition-colors ${
            device.power
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
          } disabled:opacity-50`}
        >
          {isLoading ? '...' : device.power ? 'Turn Off' : 'Turn On'}
        </button>

        {supportsBrightness && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>💡 Brightness</span>
              <span className="text-white">{Math.round((localBrightness / 254) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="254"
              value={localBrightness}
              onChange={(e) => {
                const val = parseInt(e.target.value)
                setLocalBrightness(val)
                handleControl('brightness', val)
              }}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              disabled={!device.power || isLoading}
            />
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>Off</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {supportsTemperature && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-400">
              <span>🌡️ Temperature</span>
              <span className="text-white">{localTemperature}K</span>
            </div>
            <input
              type="range"
              min="2700"
              max="6500"
              step="100"
              value={localTemperature}
              onChange={(e) => {
                const val = parseInt(e.target.value)
                setLocalTemperature(val)
                handleControl('temperature', val)
              }}
              className="w-full h-2 bg-gradient-to-r from-yellow-400 to-blue-400 rounded-lg appearance-none cursor-pointer"
              disabled={!device.power || isLoading}
            />
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>Warm (2700K)</span>
              <span>Neutral (4000K)</span>
              <span>Cool (6500K)</span>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 pt-2 border-t border-white/5 flex flex-wrap gap-2">
          <span>Node: {device.node}</span>
          <span>Group: {device.groupName}</span>
          <span>Type: {device.deviceType || 'unknown'}</span>
          <span>NT: {device.nodeType}</span>
        </div>
      </div>
    </div>
  )
}

export default DeviceCard