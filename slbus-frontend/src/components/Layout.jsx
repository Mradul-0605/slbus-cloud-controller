import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useDeviceContext } from '../hooks/useDeviceContext'
import ConnectionStatus from './ConnectionStatus'
import GatewayStatus from './GatewayStatus'

const Layout = () => {
  const { logout, gateway } = useDeviceContext()
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/devices', label: 'Devices', icon: '💡' },
    { path: '/master', label: 'Master Control', icon: '🎮' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                🏠 SL BUS
              </h1>
              <div className="hidden md:flex space-x-1">
                {navItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === item.path
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.icon} {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <GatewayStatus />
              <ConnectionStatus />
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout