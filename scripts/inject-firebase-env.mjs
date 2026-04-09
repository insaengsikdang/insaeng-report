/**
 * Firebase 서비스 계정 JSON → .env 의 FIREBASE_* 세 줄 반영
 * 사용: node scripts/inject-firebase-env.mjs [경로]
 * 기본 경로: 프로젝트 루트의 insaeng-report-dev-firebase-adminsdk-fbsvc-7b074b0e2a.json
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const envPath = path.join(root, '.env')

function findFirebaseJsonPath() {
  const arg = process.argv[2]?.trim()
  if (arg) return path.resolve(root, arg)

  const fromEnv = process.env.FIREBASE_JSON_FILE?.trim()
  if (fromEnv) return path.resolve(root, fromEnv)

  const exact = path.join(
    root,
    'insaeng-report-dev-firebase-adminsdk-fbsvc-7b074b0e2a.json'
  )
  if (fs.existsSync(exact)) return exact

  let files = []
  try {
    files = fs.readdirSync(root, { withFileTypes: true })
  } catch {
    return null
  }
  const jsonFiles = files
    .filter((d) => d.isFile() && d.name.endsWith('.json'))
    .map((d) => d.name)
  const match = jsonFiles.find(
    (n) =>
      /firebase-adminsdk|insaeng-report.*firebase|.*-firebase-.*adminsdk/i.test(n)
  )
  if (match) return path.join(root, match)

  return null
}

const jsonPath = findFirebaseJsonPath()

if (!jsonPath || !fs.existsSync(jsonPath)) {
  console.error('Firebase 서비스 계정 JSON을 찾지 못했습니다.')
  console.error('프로젝트 루트:', root)
  try {
    const jsonInRoot = fs
      .readdirSync(root, { withFileTypes: true })
      .filter((d) => d.isFile() && d.name.endsWith('.json'))
      .map((d) => d.name)
    console.error('루트에 있는 .json 파일:', jsonInRoot.length ? jsonInRoot.join(', ') : '(없음)')
  } catch {
    /* ignore */
  }
  console.error('')
  console.error('해결: Firebase 콘솔에서 키 JSON을 다운로드해 위 루트에 두거나,')
  console.error('  npm run firebase:env -- path/to/your-key.json')
  process.exit(1)
}

console.log('사용할 JSON:', jsonPath)

const j = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
const projectId = j.project_id
const clientEmail = j.client_email
const privateKey = j.private_key

if (!projectId || !clientEmail || !privateKey) {
  console.error('JSON에 project_id, client_email, private_key가 없습니다.')
  process.exit(1)
}

const escapedKey = privateKey.replace(/\\/g, '\\\\').replace(/\r\n/g, '\n').replace(/\n/g, '\\n')
const firebaseLines = [
  `FIREBASE_PROJECT_ID=${projectId}`,
  `FIREBASE_CLIENT_EMAIL=${clientEmail}`,
  `FIREBASE_PRIVATE_KEY="${escapedKey}"`,
]

let envText = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''
const keys = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY']
for (const k of keys) {
  envText = envText.replace(new RegExp(`^${k}=.*$`, 'gm'), '')
}
envText = envText.replace(/\n{3,}/g, '\n\n').trimEnd()
if (envText && !envText.endsWith('\n')) envText += '\n'
if (envText) envText += '\n'
envText += '# Firebase (서비스 계정 JSON에서 주입 — scripts/inject-firebase-env.mjs)\n'
envText += firebaseLines.join('\n') + '\n'

fs.writeFileSync(envPath, envText, 'utf8')
console.log('업데이트됨:', envPath)
