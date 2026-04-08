import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 프록시는 Vite가 실제로 뜬 포트(5173이 막히면 5174, 5175 …)에 자동으로 붙습니다.
// Windows에서 localhost → ::1 로 가다 백엔드가 127.0.0.1 만 열었을 때 연결 실패할 수 있어 target은 127.0.0.1 고정.
const API_TARGET = 'http://127.0.0.1:3001'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false,
        configure(proxy) {
          proxy.on('error', (err, _req, res) => {
            console.error('[vite proxy /api → 3001]', err.message)
            if (res && !res.headersSent) {
              res.writeHead(502, { 'Content-Type': 'application/json' })
              res.end(
                JSON.stringify({
                  error:
                    '백엔드(3001)에 연결할 수 없습니다. 터미널에서 npm run server 를 실행했는지 확인하세요.',
                })
              )
            }
          })
        },
      },
    },
  },
})
