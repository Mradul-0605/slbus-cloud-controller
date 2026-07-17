import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useDeviceContext } from './hooks/useDeviceContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import DeviceControl from './pages/DeviceControl'
import MasterControl from './pages/MasterControl'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h1>
            <p className="text-gray-400 mb-4">{this.state.error?.message}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  const { isLoggedIn, loading } = useDeviceContext()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          isLoggedIn ? <Layout /> : <Navigate to="/login" />
        }>
          <Route index element={<Dashboard />} />
          <Route path="devices" element={<DeviceControl />} />
          <Route path="master" element={<MasterControl />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}

export default App