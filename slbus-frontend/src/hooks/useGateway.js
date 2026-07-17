import { useDeviceContext } from './useDeviceContext'

export const useGateway = () => {
  const { gateway, isLoggedIn, loading } = useDeviceContext()

  return {
    gateway,
    isConnected: gateway?.connected || false,
    isLoggedIn,
    loading,
    gatewayName: gateway?.gatewayName || 'Unknown Gateway',
    uuid: gateway?.uuid || null,
    custid: gateway?.custid || null
  }
}