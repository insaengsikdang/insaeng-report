import express from 'express'
import cors from 'cors'
import fs from 'fs'
import http from 'node:http'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import analyticsRouter from './routes/analytics.js'
import geminiRouter from './routes/gemini.js'
import dailyReportRouter, { startDailyReportScheduler } from './routes/dailyReport.js'
import { listGeminiApiKeys } from '../lib/geminiKeys.js'

// process.cwd()가 프로젝트 루트가 아닐 때(하위 폴더에서 실행 등)에도 .env를 찾도록
// server/index.js 기준 상위 폴더(저장소 루트)를 고정한다.
// dotenv v17의 config()는 DOTENV_KEY가 있으면 .env.vault 경로로 가므로,
// 일반 .env는 configDotenv로 직접 로드한다.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const envPath = path.join(repoRoot, '.env')
const envLocalPath = path.join(repoRoot, '.env.local')

const loadEnv = (filePath, override = false) => {
  if (!fs.existsSync(filePath)) return
  const r = dotenv.configDotenv({ path: filePath, override, quiet: true })
  if (r.error) {
    console.warn(`⚠ .env 로드 오류 (${filePath}):`, r.error.message)
  }
}

// Windows 등에서 사용자/시스템 환경에 GA4_* / GEMINI_* 가 "빈 문자열"로 잡혀 있으면
// dotenv 기본(override: false)은 .env 값을 넣지 않는다. 프로젝트 .env가 우선이 되도록 override.
loadEnv(envPath, true)
loadEnv(envLocalPath, true)

const app = express()
const PORT = process.env.PORT || 3001

// Vite는 5173이 점유되면 5174·5175 등으로 올라감. 직접 3001 호출 시에도 로컬 포트 허용
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true)
      if (
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
      ) {
        return cb(null, true)
      }
      cb(null, false)
    },
  })
)
app.use(express.json())

// 라우터
app.use('/api/analytics', analyticsRouter)
app.use('/api/gemini', geminiRouter)
app.use('/api/daily-report', dailyReportRouter)

// 헬스체크
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// app.listen()은 실패 시에도 콜백을 error 핸들러로 묶어 두어, 포트 충돌(EADDRINUSE)인데도
// "실행 중" 로그만 나오고 프로세스가 바로 종료되는 문제가 있다. http.Server로 분리해 처리한다.
const server = http.createServer(app)

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\n✗ 포트 ${PORT}는 이미 사용 중입니다. 다른 터미널의 npm run server / dev:all을 종료하거나 .env의 PORT를 바꿔 주세요.\n`
    )
  } else {
    console.error('\n✗ 서버 listen 오류:', err.message, '\n')
  }
  process.exit(1)
})

server.listen(PORT, () => {
  const keyRel = (process.env.GA4_KEY_FILE || '').trim()
  const keyAbs = keyRel ? path.resolve(repoRoot, keyRel) : ''
  const keyOk = keyAbs && fs.existsSync(keyAbs)

  console.log(`\n🚀 백엔드 서버 실행 중: http://localhost:${PORT}`)
  console.log(`   작업 디렉터리: ${process.cwd()}`)
  console.log(`   .env 경로:     ${envPath} (${fs.existsSync(envPath) ? '파일 있음' : '파일 없음'})`)
  console.log(`   GA4 Property:  ${process.env.GA4_PROPERTY_ID?.trim() || '미설정'}`)
  console.log(
    `   GA4 키 파일:   ${keyRel || '미설정'}${keyRel ? (keyOk ? ' (경로 확인됨)' : ' (파일 없음 — 경로를 프로젝트 루트 기준으로 확인)') : ''}`
  )
  const geminiKeys = listGeminiApiKeys()
  console.log(
    `   Gemini API:    ${geminiKeys.length ? '✓ 설정됨' : '✗ 미설정'}${geminiKeys.length > 1 ? ' (주 키 + 보조 키)' : ''}\n`
  )

  startDailyReportScheduler()
})
