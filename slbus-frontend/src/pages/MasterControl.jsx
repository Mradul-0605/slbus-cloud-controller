import React, { useState } from 'react'
import { useDeviceContext } from '../hooks/useDeviceContext'
import { useDevices } from '../hooks/useDevices'

const MasterControl = () => {
  const { devices, controlDevice } = useDeviceContext()
  const { stats } = useDevices()
  const [masterBrightness, setMasterBrightness] = useState(127)
  const [masterTemperature, setMasterTemperature] = useState(4000)
  const [selectedGroup, setSelectedGroup] = useState(null)

  const handleAllOn = async () => {
    for (const device of devices) {
      if (!device.power) {
        await controlDevice(device.node, device.groupId, 'power', true)
      }
    }
  }

  const handleAllOff = async () => {
    for (const device of devices) {
      if (device.power) {
        await controlDevice(device.node, device.groupId, 'power', false)
      }
    }
  }

  const handleMasterBrightness = async (value) => {
    setMasterBrightness(value)
    const targetDevices = selectedGroup 
      ? devices.filter(d => d.groupId === selectedGroup)
      : devices
    for (const device of targetDevices) {
      if (device.hasBrightness || device.deviceType === 'dimmer' || device.deviceType === 'white_tunable') {
        await controlDevice(device.node, device.groupId, 'brightness', value)
      }
    }
  }

  const handleMasterTemperature = async (value) => {
    setMasterTemperature(value)
    const targetDevices = selectedGroup 
      ? devices.filter(d => d.groupId === selectedGroup)
      : devices
    for (const device of targetDevices) {
      if (device.hasTemperature || device.deviceType === 'white_tunable' || device.deviceType === 'led') {
        await controlDevice(device.node, device.groupId, 'temperature', value)
      }
    }
  }

  const getGroups = () => {
    const groupMap = new Map()
    devices.forEach(d => {
      if (!groupMap.has(d.groupId)) {
        groupMap.set(d.groupId, { groupId: d.groupId, groupName: d.groupName })
      }
    })
    return Array.from(groupMap.values())
  }

  const brightnessDevices = devices.filter(d => 
    d.hasBrightness || d.deviceType === 'dimmer' || d.deviceType === 'white_tunable'
  )

  const tempDevices = devices.filter(d => 
    d.hasTemperature || d.deviceType === 'white_tunable' || d.deviceType === 'led'
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-200">🎮 Master Control</h1>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedGroup(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !selectedGroup
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          All Groups
        </button>
        {getGroups().map(group => (
          <button
            key={group.groupId}
            onClick={() => setSelectedGroup(group.groupId)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedGroup === group.groupId
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {group.groupName}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={handleAllOn}
          className="glass rounded-xl p-6 text-center hover:border-green-500/30 transition-colors"
        >
          <span className="text-4xl block mb-2">💡</span>
          <span className="font-semibold text-green-400">Turn All On</span>
          <p className="text-sm text-gray-400 mt-1">({stats.off} devices off)</p>
        </button>
        <button
          onClick={handleAllOff}
          className="glass rounded-xl p-6 text-center hover:border-red-500/30 transition-colors"
        >
          <span className="text-4xl block mb-2">🔌</span>
          <span className="font-semibold text-red-400">Turn All Off</span>
          <p className="text-sm text-gray-400 mt-1">({stats.on} devices on)</p>
        </button>
      </div>

      {brightnessDevices.length > 0 && (
        <div className="glass rounded-xl p-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-300">💡 Master Brightness</span>
            <span className="text-sm text-gray-400">
              {Math.round((masterBrightness / 254) * 100)}%
              <span className="text-xs ml-2 text-gray-500">({brightnessDevices.length} devices)</span>
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="254"
            value={masterBrightness}
            onChange={(e) => handleMasterBrightness(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>Off</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {tempDevices.length > 0 && (
        <div className="glass rounded-xl p-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-300">🌡️ Master Temperature</span>
            <span className="text-sm text-gray-400">
              {masterTemperature}K
              <span className="text-xs ml-2 text-gray-500">({tempDevices.length} devices)</span>
            </span>
          </div>
          <input
            type="range"
            min="2700"
            max="6500"
            step="100"
            value={masterTemperature}
            onChange={(e) => handleMasterTemperature(parseInt(e.target.value))}
            className="w-full h-2 bg-gradient-to-r from-yellow-400 to-blue-400 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>Warm (2700K)</span>
            <span>Neutral (4000K)</span>
            <span>Cool (6500K)</span>
          </div>
        </div>
      )}

      <div className="glass rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">Device Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-400">Total Devices</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Online</p>
            <p className="text-2xl font-bold text-green-400">{stats.online}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Powered On</p>
            <p className="text-2xl font-bold text-blue-400">{stats.on}</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Powered Off</p>
            <p className="text-2xl font-bold text-gray-400">{stats.off}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MasterControl