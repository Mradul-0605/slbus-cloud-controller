import { useState, useCallback } from 'react'
import { useDeviceContext } from './useDeviceContext'

export const useAuth = () => {
  const { login, logout, isLoggedIn, loading } = useDeviceContext()
  const [error, setError] = useState(null)

  const handleLogin = useCallback(async (email, password) => {
    setError(null)
    const result = await login(email, password)
    if (!result.success) {
      setError(result.error)
    }
    return result
  }, [login])

  return {
    isLoggedIn,
    loading,
    error,
    login: handleLogin,
    logout
  }
}