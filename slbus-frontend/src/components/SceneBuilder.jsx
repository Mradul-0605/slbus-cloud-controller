import React, { useState, useEffect } from 'react'
import { useDeviceContext } from '../hooks/useDeviceContext'

const SceneBuilder = ({ onClose, onSceneCreated }) => {
  const { groups, devices } = useDeviceContext()
  const [sceneName, setSceneName] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [sceneNodes, setSceneNodes] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [mode, setMode] = useState('custom')

  useEffect(() => {
    if (selectedGroup) {
      const groupDevices = devices.filter(d => d.groupId === selectedGroup)
      const initialNodes = {}
      groupDevices.forEach(device => {
        initialNodes[device.node] = {
          enabled: false,
          value: device.brightness || 127,
          temperature: device.temperature || 4000,
          state: 'on'
        }
      })
      setSceneNodes(initialNodes)
    }
  }, [selectedGroup, devices])

  const handleNodeToggle = (node) => {
    setSceneNodes(prev => ({
      ...prev,
      [node]: {
        ...prev[node],
        enabled: !prev[node].enabled
      }
    }))
  }

  const handleNodeValueChange = (node, field, value) => {
    setSceneNodes(prev => ({
      ...prev,
      [node]: {
        ...prev[node],
        [field]: value
      }
    }))
  }

  const handleCreateCustomScene = async () => {
    if (!sceneName || !selectedGroup) {
      alert('Please enter a scene name and select a group')
      return
    }

    const nodes = Object.entries(sceneNodes)
      .filter(([node, data]) => data.enabled)
      .map(([node, data]) => ({
        node: parseInt(node),
        value: data.value || 127,
        temperature: data.temperature || 4000,
        state: data.state || 'on'
      }))

    if (nodes.length === 0) {
      alert('Please select at least one device for the scene')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/scene/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sceneName,
          groupId: selectedGroup,
          nodes: nodes
        })
      })
      
      const data = await response.json()
      if (data.success) {
        alert(`✅ Scene "${sceneName}" created successfully!`)
        if (onSceneCreated) onSceneCreated()
        setTimeout(() => {
          if (onClose) onClose()
        }, 500)
      } else {
        alert('❌ Failed to create scene: ' + data.error)
      }
    } catch (error) {
      console.error('Failed to create scene:', error)
      alert('❌ Failed to create scene: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveCurrentState = async () => {
    if (!sceneName || !selectedGroup) {
      alert('Please enter a scene name and select a group')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/scene/save-current', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sceneName,
          groupId: selectedGroup
        })
      })
      
      const data = await response.json()
      if (data.success) {
        alert(`✅ Scene "${sceneName}" saved successfully!`)
        if (onSceneCreated) onSceneCreated()
        setTimeout(() => {
          if (onClose) onClose()
        }, 500)
      } else {
        alert('❌ Failed to save scene: ' + data.error)
      }
    } catch (error) {
      console.error('Failed to save scene:', error)
      alert('❌ Failed to save scene: ' + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  const selectedGroupDevices = devices.filter(d => d.groupId === selectedGroup)

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-white/10">
        <div className="p-6 border-b border-white/10 bg-gray-800/95 sticky top-0 z-20">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-200">🎬 Scene Builder</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Scene Name</label>
              <input
                type="text"
                value={sceneName}
                onChange={(e) => setSceneName(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="Enter scene name..."
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Group</label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select a group</option>
                {groups.map((group) => (
                  <option key={group.groupId} value={group.groupId}>
                    {group.groupName || `Group ${group.groupId}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Mode</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setMode('custom')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === 'custom'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  Custom Scene
                </button>
                <button
                  onClick={() => setMode('save-current')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    mode === 'save-current'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-white/5 text-gray-400 hover:text-white'
                  }`}
                >
                  Save Current State
                </button>
              </div>
            </div>
          </div>

          {selectedGroup && mode === 'custom' && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-3">
                Configure Devices ({selectedGroupDevices.length} devices in this group)
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {selectedGroupDevices.map((device) => {
                  const supportsBrightness = device.hasBrightness || 
                    device.deviceType === 'dimmer' || 
                    device.deviceType === 'white_tunable' ||
                    device.deviceType === 'led'
                  
                  const supportsTemperature = device.hasTemperature ||
                    device.deviceType === 'white_tunable' ||
                    device.deviceType === 'led'

                  return (
                    <div key={`${device.node}-${device.groupId}`} className="bg-white/5 rounded-lg p-4 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={sceneNodes[device.node]?.enabled || false}
                            onChange={() => handleNodeToggle(device.node)}
                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-white font-medium">{device.name}</span>
                          <span className="text-xs text-gray-400">(Node {device.node})</span>
                        </div>
                        <span className={`text-xs ${device.power ? 'text-green-400' : 'text-gray-500'}`}>
                          {device.power ? 'ON' : 'OFF'}
                        </span>
                      </div>

                      {sceneNodes[device.node]?.enabled && (
                        <div className="ml-7 space-y-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-400">State:</span>
                            <button
                              onClick={() => handleNodeValueChange(device.node, 'state', 'on')}
                              className={`px-3 py-1 rounded text-xs transition-colors ${
                                sceneNodes[device.node]?.state === 'on'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-white/5 text-gray-400 hover:text-white'
                              }`}
                            >
                              ON
                            </button>
                            <button
                              onClick={() => handleNodeValueChange(device.node, 'state', 'off')}
                              className={`px-3 py-1 rounded text-xs transition-colors ${
                                sceneNodes[device.node]?.state === 'off'
                                  ? 'bg-red-500/20 text-red-400'
                                  : 'bg-white/5 text-gray-400 hover:text-white'
                              }`}
                            >
                              OFF
                            </button>
                          </div>

                          {supportsBrightness && (
                            <div>
                              <div className="flex justify-between text-xs text-gray-400">
                                <span>💡 Brightness</span>
                                <span className="text-white">
                                  {Math.round((sceneNodes[device.node]?.value || 0) / 254 * 100)}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="254"
                                value={sceneNodes[device.node]?.value || 0}
                                onChange={(e) => handleNodeValueChange(
                                  device.node,
                                  'value',
                                  parseInt(e.target.value)
                                )}
                                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                              />
                            </div>
                          )}

                          {supportsTemperature && (
                            <div>
                              <div className="flex justify-between text-xs text-gray-400">
                                <span>🌡️ Temperature</span>
                                <span className="text-white">{sceneNodes[device.node]?.temperature || 4000}K</span>
                              </div>
                              <input
                                type="range"
                                min="2700"
                                max="6500"
                                step="100"
                                value={sceneNodes[device.node]?.temperature || 4000}
                                onChange={(e) => handleNodeValueChange(
                                  device.node,
                                  'temperature',
                                  parseInt(e.target.value)
                                )}
                                className="w-full h-1 bg-gradient-to-r from-yellow-400 to-blue-400 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {selectedGroup && mode === 'save-current' && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-green-400 text-sm">
                💾 This will save the current state of ALL devices in this group as a scene.
                <br />
                <span className="text-gray-400 text-xs">
                  ({selectedGroupDevices.length} devices will be saved)
                </span>
              </p>
            </div>
          )}

          {!selectedGroup && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-lg">Select a group to start building your scene</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-gray-800/95 sticky bottom-0 z-20 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          {mode === 'custom' ? (
            <button
              onClick={handleCreateCustomScene}
              disabled={isSaving || !sceneName || !selectedGroup}
              className="px-6 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Creating...' : '✨ Create Custom Scene'}
            </button>
          ) : (
            <button
              onClick={handleSaveCurrentState}
              disabled={isSaving || !sceneName || !selectedGroup}
              className="px-6 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : '💾 Save Current State'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SceneBuilder