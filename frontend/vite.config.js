import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/register': 'http://localhost:5000',
      '/login': 'http://localhost:5000',
      '/profile': 'http://localhost:5000',
      '/admin': 'http://localhost:5000',
    },
  },
})
