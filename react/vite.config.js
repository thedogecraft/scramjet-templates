import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/scram': {
        target: 'http://localhost:8081',
        changeOrigin: true
      },
      '/epoxy': {
        target: 'http://localhost:8081',
        changeOrigin: true
      },
      '/baremux': {
        target: 'http://localhost:8081',
        changeOrigin: true
      },
      '/wisp': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
