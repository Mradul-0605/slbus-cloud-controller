import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://slbus-backend.onrender.com',  // ← CHANGE THIS
        changeOrigin: true,
        secure: true
      },
      '/socket.io': {
        target: 'https://slbus-backend.onrender.com',  // ← CHANGE THIS
        ws: true,
        changeOrigin: true
      }
    }
  }
})