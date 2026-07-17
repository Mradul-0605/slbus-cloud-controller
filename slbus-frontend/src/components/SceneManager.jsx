import React, { useState, useEffect } from 'react'
import { useDeviceContext } from '../hooks/useDeviceContext'
import SceneBuilder from './SceneBuilder'

// ✅ HARDCODED - YOUR BACKEND URL
const API_BASE = 'https://slbus-backend.onrender.com/api'

const SceneManager = () => {
  const { scenes, refreshScenes } = useDeviceContext()
  const [showBuilder, setShowBuilder] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [localScenes, setLocalScenes] = useState([])
  const [error, setError] = useState(null)
  const [executionResult, setExecutionResult] = useState(null)

  useEffect(() => {
    loadScenes()
  }, [])

  const loadScenes = async () => {
    try {
      console.log('📡 Fetching from:', `${API_BASE}/scenes`)
      const response = await fetch(`${API_BASE}/scenes`)  // ← FIXED
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      const data = await response.json()
      if (data.success) {
        setLocalScenes(data.scenes || [])
        setError(null)
      } else {
        setError(data.error || 'Failed to load scenes')
      }
    } catch (error) {
      console.error('Failed to load scenes:', error)
      setError('Failed to load scenes: ' + error.message)
    }
  }

  useEffect(() => {
    if (scenes && scenes.length > 0) {
      setLocalScenes(scenes)
    }
  }, [scenes])

  const handleExecuteScene = async (sceneId, groupId, sceneName) => {
    setIsExecuting(true)
    setError(null)
    setExecutionResult(null)
    
    try {
      console.log(`🎬 Executing scene: ${sceneName || sceneId}`)
      console.log(`📤 Sending to: ${API_BASE}/scene/execute`)
      
      const response = await fetch(`${API_BASE}/scene/execute`, {  // ← FIXED
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sceneKey: sceneId, 
          groupId: groupId 
        })
      })

      if (!response.ok) {
        const text = await response.text()
        console.error('❌ Server response:', text)
        throw new Error(`Server returned ${response.status}: ${text || 'Unknown error'}`)
      }

      const data = await response.json()
      console.log('📥 Response:', data)
      
      if (data.success) {
        setExecutionResult({
          success: true,
          message: `✅ Scene "${data.scene || sceneName}" executed successfully!`,
          results: data.results
        })
        
        if (data.results) {
          const successCount = data.results.filter(r => r.success).length
          const failCount = data.results.filter(r => !r.success).length
          console.log(`📊 Results: ${successCount} succeeded, ${failCount} failed`)
          
          const nodeDetails = data.results.map(r => 
            `Node ${r.node}: ${r.success ? '✅' : '❌'} ${r.action || 'power'} ${r.value || ''}`
          ).join('\n')
          
          alert(`✅ Scene "${data.scene || sceneName}" executed!\n\n${nodeDetails}`)
        } else {
          alert(`✅ Scene "${data.scene || sceneName}" executed successfully!`)
        }
      } else {
        throw new Error(data.error || 'Failed to execute scene')
      }
    } catch (error) {
      console.error('❌ Scene execution failed:', error)
      setError(error.message)
      alert(`❌ Failed to execute scene: ${error.message}`)
    } finally {
      setIsExecuting(false)
    }
  }

  const handleDeleteScene = async (sceneId) => {
    if (!confirm('Are you sure you want to delete this scene?')) return
    
    try {
      const response = await fetch(`${API_BASE}/scene/delete/${sceneId}`, {  // ← FIXED
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      if (data.success) {
        alert('✅ Scene deleted successfully!')
        await loadScenes()
        if (refreshScenes) refreshScenes()
      } else {
        throw new Error(data.error || 'Failed to delete scene')
      }
    } catch (error) {
      console.error('Failed to delete scene:', error)
      alert('❌ Failed to delete scene: ' + error.message)
    }
  }

  const handleSceneCreated = async () => {
    await loadScenes()
    if (refreshScenes) refreshScenes()
  }

  const getSceneName = (scene) => {
    return scene.scene_name || scene.name || `Scene ${scene.scene_id?.substring(0, 8)}`
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

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg mb-4 text-sm">
            ⚠️ {error}
          </div>
        )}

        {executionResult && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            executionResult.success 
              ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}>
            {executionResult.message}
          </div>
        )}

        <div className="space-y-2">
          {localScenes.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              No scenes created yet. Click "Create Scene" to get started!
            </p>
          ) : (
            localScenes.map((scene) => (
              <div key={scene.scene_id || scene.id} className="bg-white/5 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-gray-200">{getSceneName(scene)}</span>
                    <span className="text-xs text-gray-400 ml-2">
                      {scene.group_name || scene.group_id || 'No group'} • 
                      {scene.nodes?.length || 0} devices
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleExecuteScene(
                        scene.scene_id || scene.id, 
                        scene.group_id || scene.groupId,
                        getSceneName(scene)
                      )}
                      disabled={isExecuting || !scene.nodes || scene.nodes.length === 0}
                      className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                        isExecuting || !scene.nodes || scene.nodes.length === 0
                          ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                    >
                      {isExecuting ? '⏳...' : '▶ Execute'}
                    </button>
                    <button
                      onClick={() => handleDeleteScene(scene.scene_id || scene.id)}
                      className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-xs"
                    >
                      ✕ Delete
                    </button>
                  </div>
                </div>
                
                {scene.nodes && scene.nodes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {scene.nodes.slice(0, 3).map((node, idx) => (
                      <span key={idx} className="text-xs bg-white/5 px-2 py-0.5 rounded text-gray-400">
                        Node {node.node}: {node.value > 0 ? `${Math.round((node.value/254)*100)}%` : 'OFF'}
                        {node.temperature && node.value > 0 && ` • ${node.temperature}K`}
                      </span>
                    ))}
                    {scene.nodes.length > 3 && (
                      <span className="text-xs text-gray-500">+{scene.nodes.length - 3} more</span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

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