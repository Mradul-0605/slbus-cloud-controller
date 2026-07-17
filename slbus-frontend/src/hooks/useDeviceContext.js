import { useContext } from 'react'
import { DeviceContext } from '../context/DeviceContext'

export const useDeviceContext = () => {
  const context = useContext(DeviceContext)
  if (!context) {
    throw new Error('useDeviceContext must be used within DeviceProvider')
  }
  return context
}