import React, { useState, useEffect } from 'react'
import { useDeviceContext } from '../hooks/useDeviceContext'
import SceneBuilder from './SceneBuilder'

const SceneManager = () => {
  const { scenes, executeScene, refreshScenes } = useDeviceContext()
  const [showBuilder, setShowBuilder] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [localScenes, setLocalScenes] = useState([])

  // Load scenes on mount
  useEffect(() => {
    const loadScenes = async () => {
      try {
        const response = await fetch('/api/scenes')
        const data = await response.json()
        if (data.success) {
          setLocalScenes(data.scenes)
        }
      } catch (error) {
        console.error('Failed to load scenes:', error)
      }
    }
    loadScenes()
  }, [])

  // Refresh when scenes change
  useEffect(() => {
    if (scenes) {
      setLocalScenes(scenes)
    }
  }, [scenes])

  const handleExecuteScene = async (sceneId, groupId) => {
    setIsExecuting(true)
    try {
      const response = await fetch('/api/scene/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneKey: sceneId, groupId })
      })
      const data = await response.json()
      if (data.success) {
        alert(`✅ Scene "${data.scene}" executed successfully!`)
      } else {
        alert('❌ Failed to execute scene: ' + data.error)
      }
    } catch (error) {
      console.error('Scene execution failed:', error)
      alert('❌ Failed to execute scene')
    } finally {
      setIsExecuting(false)
    }
  }

  const handleDeleteScene = async (sceneId) => {
    if (!confirm('Are you sure you want to delete this scene?')) return
    
    try {
      const response = await fetch(`/api/scene/delete/${sceneId}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        alert('✅ Scene deleted successfully!')
        // Refresh the list
        const refreshResponse = await fetch('/api/scenes')
        const refreshData = await refreshResponse.json()
        if (refreshData.success) {
          setLocalScenes(refreshData.scenes)
          if (refreshScenes) refreshScenes()
        }
      }
    } catch (error) {
      console.error('Failed to delete scene:', error)
      alert('❌ Failed to delete scene')
    }
  }

  const handleSceneCreated = async () => {
    try {
      const response = await fetch('/api/scenes')
      const data = await response.json()
      if (data.success) {
        setLocalScenes(data.scenes)
        if (refreshScenes) refreshScenes()
      }
    } catch (error) {
      console.error('Failed to refresh scenes:', error)
    }
  }

  return (
    <>
      <div className="glass rounded-xl p-6 relative z-10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-200">🎬 Scenes</h2>
            <p className="text-sm text-gray-400">Execute or create custom scenes</p>
          </div>
          <button
            onClick={() => setShowBuilder(true)}
            className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center space-x-2"
          >
            <span>+</span>
            <span>Create Scene</span>
          </button>
        </div>

        {/* Scene List */}
        <div className="space-y-2">
          {localScenes.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              No scenes created yet. Click "Create Scene" to get started!
            </p>
          ) : (
            localScenes.map((scene) => (
              <div key={scene.scene_id} className="bg-white/5 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-gray-200">{scene.scene_name}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {scene.group_name || scene.group_id} • {scene.nodes?.length || 0} devices
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleExecuteScene(scene.scene_id, scene.group_id)}
                      disabled={isExecuting}
                      className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-xs disabled:opacity-50"
                    >
                      ▶ Execute
                    </button>
                    <button
                      onClick={() => handleDeleteScene(scene.scene_id)}
                      className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-xs"
                    >
                      ✕ Delete
                    </button>
                  </div>
                </div>
                {scene.nodes && scene.nodes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {scene.nodes.map((node, idx) => (
                      <span key={idx} className="text-xs bg-white/5 px-2 py-0.5 rounded text-gray-400">
                        Node {node.node}: {node.value > 0 ? `${Math.round((node.value/254)*100)}%` : 'OFF'}
                        {node.temperature && ` • ${node.temperature}K`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Scene Builder Modal */}
      {showBuilder && (
        <SceneBuilder
          onClose={() => setShowBuilder(false)}
          onSceneCreated={handleSceneCreated}
        />
      )}
    </>
  )
}

export default SceneManager