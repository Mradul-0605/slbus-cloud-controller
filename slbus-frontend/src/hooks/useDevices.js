import { useMemo, useCallback } from 'react'
import { useDeviceContext } from './useDeviceContext'

export const useDevices = () => {
  const { devices, controlDevice, groups } = useDeviceContext()

  const getDevice = useCallback((node) => {
    return devices.find(d => d.node === node)
  }, [devices])

  const getDevicesByGroup = useCallback((groupId) => {
    return devices.filter(d => d.groupId === groupId)
  }, [devices])

  const getDeviceType = useCallback((deviceType) => {
    const types = {
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
    return types[deviceType] || '📱'
  }, [])

  const stats = useMemo(() => ({
    total: devices.length,
    online: devices.filter(d => d.online).length,
    on: devices.filter(d => d.power).length,
    off: devices.filter(d => !d.power).length,
    byGroup: groups.map(group => ({
      ...group,
      deviceCount: devices.filter(d => d.groupId === group.groupId).length,
      onCount: devices.filter(d => d.groupId === group.groupId && d.power).length
    }))
  }), [devices, groups])

  return {
    devices,
    stats,
    getDevice,
    getDevicesByGroup,
    getDeviceType,
    controlDevice
  }
}