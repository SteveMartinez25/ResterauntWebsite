import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // anything starting with /api will be forwarded to your Express server
      '/api': 'http://localhost:5174'
    }
  }
})
