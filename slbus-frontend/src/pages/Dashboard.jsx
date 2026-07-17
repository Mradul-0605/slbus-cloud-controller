import React from 'react'
import { useDevices } from '../hooks/useDevices'
import { useGateway } from '../hooks/useGateway'
import DeviceCard from '../components/DeviceCard'
import SceneManager from '../components/SceneManager'

const Dashboard = () => {
  const { devices, stats } = useDevices()
  const { gateway } = useGateway()

  const statsCards = [
    { label: 'Total Devices', value: stats.total, icon: '📱' },
    { label: 'Online', value: stats.online, icon: '🟢' },
    { label: 'Powered On', value: stats.on, icon: '💡' },
    { label: 'Groups', value: stats.byGroup.length, icon: '📦' }
  ]

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-6">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-2xl font-bold text-white">{stat.value}</span>
            </div>
            <p className="text-sm text-gray-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Scene Manager */}
      <SceneManager />

      {/* Devices Grid */}
      <div>
        <h2 className="text-xl font-semibold text-gray-200 mb-4">
          Devices ({devices.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.map((device) => (
            <DeviceCard key={device.node} device={device} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard