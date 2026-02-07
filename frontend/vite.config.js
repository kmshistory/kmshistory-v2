import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 환경에 따라 백엔드 포트 결정 (스테이징: 8009, 프로덕션: 8006)
const BACKEND_PORT = process.env.BACKEND_PORT || process.env.VITE_BACKEND_PORT

if (!BACKEND_PORT) {
  throw new Error('BACKEND_PORT is not defined')
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3004,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: `http://localhost:${BACKEND_PORT}`,
        changeOrigin: true,
        secure: false,
      }
    }
  }
})