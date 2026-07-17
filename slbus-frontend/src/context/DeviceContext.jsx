import React, { createContext, useState, useEffect, useCallback } from 'react'
import apiClient from '../api/client'
import socketManager from '../socket/socket'

export const DeviceContext = createContext()

export const DeviceProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [gateway, setGateway] = useState(null)
  const [devices, setDevices] = useState([])
  const [groups, setGroups] = useState([])
  const [scenes, setScenes] = useState([])
  const [sensors, setSensors] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const socket = socketManager.connect()

    socket.on('connect', () => {
      console.log('✅ Socket connected')
    })

    socket.on('initial_state', (state) => {
      console.log('📦 Initial state received:', state)
      if (state.gateway?.connected) {
        setGateway(state.gateway)
        setDevices(state.devices || [])
        setGroups(state.groups || [])
        setScenes(state.scenes || [])
        setSensors(state.sensors || [])
        setIsLoggedIn(true)
      }
      setLoading(false)
    })

    socket.on('devices_updated', (updatedDevices) => {
      console.log('🔄 Devices updated:', updatedDevices)
      setDevices(updatedDevices)
    })

    socket.on('device_updated', (device) => {
      console.log('💡 Device updated:', device)
      setDevices(prev => 
        prev.map(d => {
          if (d.node === device.node && d.groupId === device.groupId) {
            return { ...d, ...device }
          }
          return d
        })
      )
    })

    socket.on('gateway_updated', (gatewayData) => {
      console.log('🏠 Gateway updated:', gatewayData)
      setGateway(gatewayData)
    })

    socket.on('groups_updated', (updatedGroups) => {
      console.log('📦 Groups updated:', updatedGroups)
      setGroups(updatedGroups)
    })

    socket.on('scenes_updated', (updatedScenes) => {
      console.log('🎬 Scenes updated:', updatedScenes)
      setScenes(updatedScenes)
    })

    socket.on('sensors_updated', (updatedSensors) => {
      console.log('📊 Sensors updated:', updatedSensors)
      setSensors(updatedSensors)
    })

    return () => {
      socketManager.disconnect()
    }
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.post('/login', { email, password })
      console.log('📋 Login response:', response.data)
      
      if (response.data.success) {
        setIsLoggedIn(true)
        setGateway(response.data.gateway)
        
        // Fetch devices, groups, scenes after login
        try {
          const [devicesRes, groupsRes, scenesRes] = await Promise.all([
            apiClient.get('/devices'),
            apiClient.get('/groups'),
            apiClient.get('/scenes')
          ])
          
          console.log('📦 Devices:', devicesRes.data)
          console.log('📦 Groups:', groupsRes.data)
          console.log('🎬 Scenes:', scenesRes.data)
          
          setDevices(devicesRes.data.devices || [])
          setGroups(groupsRes.data.groups || [])
          setScenes(scenesRes.data.scenes || [])
        } catch (fetchError) {
          console.error('Failed to fetch data:', fetchError)
        }
        
        return { success: true }
      } else {
        setError(response.data.error || 'Login failed')
        return { success: false, error: response.data.error }
      }
    } catch (err) {
      console.error('Login error:', err)
      const errorMsg = err.response?.data?.error || err.message || 'Login failed'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/logout')
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      setIsLoggedIn(false)
      setGateway(null)
      setDevices([])
      setGroups([])
      setScenes([])
      setSensors([])
      socketManager.disconnect()
    }
  }, [])

  const controlDevice = useCallback(async (node, groupId, action, value) => {
    try {
      const payload = { node, action, value }
      if (groupId) {
        payload.groupId = groupId
      }
      console.log('🎮 Controlling device:', payload)
      await apiClient.post('/device/action', payload)
    } catch (err) {
      console.error('Control failed:', err)
      throw err
    }
  }, [])

  const executeScene = useCallback(async (sceneKey, groupId) => {
    try {
      console.log('🎬 Executing scene:', sceneKey, groupId)
      await apiClient.post('/scene/execute', { sceneKey, groupId })
    } catch (err) {
      console.error('Scene execution failed:', err)
      throw err
    }
  }, [])

  const refreshScenes = useCallback(async () => {
    try {
      const response = await apiClient.get('/scenes')
      if (response.data.success) {
        setScenes(response.data.scenes)
      }
      return response.data
    } catch (err) {
      console.error('Failed to refresh scenes:', err)
      throw err
    }
  }, [])

  const value = {
    isLoggedIn,
    loading,
    gateway,
    devices,
    groups,
    scenes,
    sensors,
    error,
    login,
    logout,
    controlDevice,
    executeScene,
    setScenes,
    refreshScenes,
    setError
  }

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  )
}