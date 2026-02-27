import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Vite는 기본적으로 frontend/ 기준으로만 .env를 읽음. 루트(kmshistory-v2/.env)도 읽도록 상위 디렉터리에서 로드
const rootEnv = loadEnv(process.env.MODE || 'development', path.resolve(__dirname, '..'), '')
const BACKEND_PORT = process.env.BACKEND_PORT || process.env.VITE_BACKEND_PORT || rootEnv.BACKEND_PORT || rootEnv.VITE_BACKEND_PORT || '8015'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8017,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: `http://localhost:${BACKEND_PORT}`,
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: process.env.VITE_BUILD_TARGET === 'staging' ? 'dist-staging' : 'dist',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Toast UI만 분리 (용량 큼). 나머지는 한 덩어리로 해서 순환 참조 제거
            if (id.includes('@toast-ui')) {
              return 'toast-ui'
            }
            return 'vendor'
          }
        }
      }
    }
  }
})