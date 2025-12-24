import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // Proxy static file URLs (e.g. /files/pdfs/...) to the backend so local PDFs work
      '/files': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})

