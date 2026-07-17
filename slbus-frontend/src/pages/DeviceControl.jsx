import React, { useState } from 'react'
import { useDevices } from '../hooks/useDevices'
import DeviceCard from '../components/DeviceCard'

const DeviceControl = () => {
  // ✅ Destructure with a default empty array for groups
  const { devices, groups = [], stats } = useDevices() || {} 
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredDevices = (devices || [])
    .filter(d => !selectedGroup || d.groupId === selectedGroup)
    .filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-200">Device Control</h1>
        <div className="flex items-center space-x-4 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search devices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 sm:w-48 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedGroup(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !selectedGroup
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          All
        </button>
        {/* ✅ Safely map over groups, even if it's undefined */}
        {(groups || []).map(group => (
          <button
            key={group.groupId}
            onClick={() => setSelectedGroup(group.groupId)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedGroup === group.groupId
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {group.groupName} ({group.deviceCount || 0})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDevices.map((device) => (
          <DeviceCard key={device.node} device={device} />
        ))}
      </div>

      {filteredDevices.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No devices found</p>
        </div>
      )}
    </div>
  )
}

export default DeviceControl