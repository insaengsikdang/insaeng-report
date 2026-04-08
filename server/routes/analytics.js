import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { google } from 'googleapis'
import dayjs from 'dayjs'

const router = express.Router()

// process.cwd()가 프로젝트 루트가 아닐 때 키 파일 경로가 틀어지지 않도록 (OneDrive/IDE 실행 위치 대비)
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

const KPI_METRICS = [
  { name: 'sessions' },
  { name: 'transactions' },
  { name: 'totalRevenue' },
  { name: 'bounceRate' },
  { name: 'newUsers' },
  { name: 'averageSessionDuration' },
  { name: 'screenPageViewsPerSession' },
]

function normalizePropertyId(raw) {
  if (!raw || !String(raw).trim()) return null
  const s = String(raw).trim()
  if (s.startsWith('properties/')) return s
  return `properties/${s}`
}

function ga4Config(res) {
  const rawPid = (process.env.GA4_PROPERTY_ID || '').trim()
  const keyRel = (process.env.GA4_KEY_FILE || '').trim()
  const property = normalizePropertyId(rawPid)
  if (!property || !keyRel) {
    console.warn('[analytics] 503 — GA4 환경변수 없음 (Google API 호출 전)', {
      GA4_PROPERTY_ID: rawPid ? `길이 ${rawPid.length}` : '비어 있음',
      GA4_KEY_FILE: keyRel ? '설정됨' : '비어 있음',
      cwd: process.cwd(),
      repoRoot: REPO_ROOT,
    })
    res.status(503).json({
      error:
        'GA4 환경변수가 비어 있습니다. GA4_PROPERTY_ID와 GA4_KEY_FILE을 .env에 설정한 뒤 서버를 다시 시작하세요.',
    })
    return null
  }
  return { property, keyFile: path.resolve(REPO_ROOT, keyRel) }
}

async function getDataClient() {
  const keyRel = (process.env.GA4_KEY_FILE || '').trim()
  const keyFile = path.resolve(REPO_ROOT, keyRel)
  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  })
  const authClient = await auth.getClient()
  return google.analyticsdata({ version: 'v1beta', auth: authClient })
}

function parseRange(req) {
  const { startDate, endDate } = req.query
  if (!startDate || !endDate) {
    return null
  }
  return { startDate, endDate }
}

function formatGaDate(d) {
  if (!d || String(d).length !== 8) return String(d)
  const s = String(d)
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}

function metricAt(row, i) {
  const raw = row?.metricValues?.[i]?.value
  if (raw === undefined || raw === null || raw === '') return 0
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

/** bounceRate: API가 0~1 비율이면 퍼센트로 보정 */
function normalizeBounceRate(v) {
  if (v <= 0) return 0
  if (v <= 1) return Number((v * 100).toFixed(1))
  return Number(v.toFixed(1))
}

function rowToKpi(row) {
  const sessions = metricAt(row, 0)
  const transactions = metricAt(row, 1)
  const revenue = metricAt(row, 2)
  const bounceRate = normalizeBounceRate(metricAt(row, 3))
  const newUsers = metricAt(row, 4)
  const avgSessionDuration = metricAt(row, 5)
  const pageviewsPerSession = metricAt(row, 6)
  const conversionRate =
    sessions > 0 ? Number(((transactions / sessions) * 100).toFixed(2)) : 0

  return {
    sessions: Math.round(sessions),
    transactions: Math.round(transactions),
    revenue: Math.round(revenue),
    bounceRate,
    conversionRate,
    newUsers: Math.round(newUsers),
    avgSessionDuration: Math.round(avgSessionDuration),
    pageviewsPerSession: Number(pageviewsPerSession.toFixed(2)),
  }
}

async function runKpiForRange(client, property, startDate, endDate) {
  const { data } = await client.properties.runReport({
    property,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
      metrics: KPI_METRICS,
    },
  })
  const row = data.rows?.[0]
  if (!row) {
    return {
      sessions: 0,
      transactions: 0,
      revenue: 0,
      bounceRate: 0,
      conversionRate: 0,
      newUsers: 0,
      avgSessionDuration: 0,
      pageviewsPerSession: 0,
    }
  }
  return rowToKpi(row)
}

router.get('/kpi', async (req, res) => {
  const cfg = ga4Config(res)
  if (!cfg) return

  const range = parseRange(req)
  if (!range) {
    return res.status(400).json({ error: 'startDate, endDate 쿼리가 필요합니다.' })
  }

  const start = dayjs(range.startDate)
  const end = dayjs(range.endDate)
  if (!start.isValid() || !end.isValid() || start.isAfter(end, 'day')) {
    return res.status(400).json({ error: 'startDate/endDate 형식이 올바르지 않습니다.' })
  }

  const days = end.diff(start, 'day') + 1
  const prevEnd = start.subtract(1, 'day')
  const prevStart = prevEnd.subtract(days - 1, 'day')

  try {
    const client = await getDataClient()
    const [today, yesterday] = await Promise.all([
      runKpiForRange(client, cfg.property, range.startDate, range.endDate),
      runKpiForRange(
        client,
        cfg.property,
        prevStart.format('YYYY-MM-DD'),
        prevEnd.format('YYYY-MM-DD')
      ),
    ])
    res.json({ today, yesterday })
  } catch (err) {
    console.error('[analytics/kpi]', err)
    res.status(502).json({
      error: err.message || 'GA4 KPI 조회에 실패했습니다.',
    })
  }
})

router.get('/trend', async (req, res) => {
  const cfg = ga4Config(res)
  if (!cfg) return

  const range = parseRange(req)
  if (!range) {
    return res.status(400).json({ error: 'startDate, endDate 쿼리가 필요합니다.' })
  }

  try {
    const client = await getDataClient()
    const { data } = await client.properties.runReport({
      property: cfg.property,
      requestBody: {
        dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'sessions' },
          { name: 'transactions' },
          { name: 'totalRevenue' },
          { name: 'bounceRate' },
          { name: 'newUsers' },
        ],
        orderBys: [{ dimension: { dimensionName: 'date' } }],
      },
    })

    const byDate = new Map()
    for (const row of data.rows || []) {
      const dateRaw = row.dimensionValues?.[0]?.value
      const date = formatGaDate(dateRaw)
      byDate.set(date, {
        date,
        sessions: Math.round(metricAt(row, 0)),
        transactions: Math.round(metricAt(row, 1)),
        revenue: Math.round(metricAt(row, 2)),
        bounceRate: normalizeBounceRate(metricAt(row, 3)),
        newUsers: Math.round(metricAt(row, 4)),
      })
    }

    const out = []
    let cursor = dayjs(range.startDate)
    const last = dayjs(range.endDate)
    while (cursor.isSame(last, 'day') || cursor.isBefore(last, 'day')) {
      const key = cursor.format('YYYY-MM-DD')
      out.push(
        byDate.get(key) || {
          date: key,
          sessions: 0,
          transactions: 0,
          revenue: 0,
          bounceRate: 0,
          newUsers: 0,
        }
      )
      cursor = cursor.add(1, 'day')
    }

    res.json(out)
  } catch (err) {
    console.error('[analytics/trend]', err)
    res.status(502).json({
      error: err.message || 'GA4 트렌드 조회에 실패했습니다.',
    })
  }
})

router.get('/pages', async (req, res) => {
  const cfg = ga4Config(res)
  if (!cfg) return

  const range = parseRange(req)
  if (!range) {
    return res.status(400).json({ error: 'startDate, endDate 쿼리가 필요합니다.' })
  }

  try {
    const client = await getDataClient()
    const { data } = await client.properties.runReport({
      property: cfg.property,
      requestBody: {
        dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [
          { name: 'sessions' },
          { name: 'transactions' },
          { name: 'totalRevenue' },
          { name: 'bounceRate' },
        ],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 25,
      },
    })

    const pages = (data.rows || []).map((row) => {
      const pagePath = row.dimensionValues?.[0]?.value || '(not set)'
      const sessions = Math.round(metricAt(row, 0))
      const transactions = Math.round(metricAt(row, 1))
      const revenue = Math.round(metricAt(row, 2))
      const bounceRate = normalizeBounceRate(metricAt(row, 3))
      const conversionRate =
        sessions > 0 ? Number(((transactions / sessions) * 100).toFixed(2)) : 0
      return {
        pagePath,
        sessions,
        transactions,
        revenue,
        bounceRate,
        conversionRate,
      }
    })

    res.json(pages)
  } catch (err) {
    console.error('[analytics/pages]', err)
    res.status(502).json({
      error: err.message || 'GA4 페이지 리포트 조회에 실패했습니다.',
    })
  }
})

router.get('/channels', async (req, res) => {
  const cfg = ga4Config(res)
  if (!cfg) return

  const range = parseRange(req)
  if (!range) {
    return res.status(400).json({ error: 'startDate, endDate 쿼리가 필요합니다.' })
  }

  try {
    const client = await getDataClient()
    const { data } = await client.properties.runReport({
      property: cfg.property,
      requestBody: {
        dateRanges: [{ startDate: range.startDate, endDate: range.endDate }],
        dimensions: [{ name: 'sessionDefaultChannelGrouping' }],
        metrics: [
          { name: 'sessions' },
          { name: 'transactions' },
          { name: 'totalRevenue' },
        ],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 15,
      },
    })

    const channels = (data.rows || []).map((row) => {
      const channel = row.dimensionValues?.[0]?.value || '(not set)'
      const sessions = Math.round(metricAt(row, 0))
      const transactions = Math.round(metricAt(row, 1))
      const revenue = Math.round(metricAt(row, 2))
      const conversionRate =
        sessions > 0 ? Number(((transactions / sessions) * 100).toFixed(2)) : 0
      return { channel, sessions, revenue, conversionRate }
    })

    res.json(channels)
  } catch (err) {
    console.error('[analytics/channels]', err)
    res.status(502).json({
      error: err.message || 'GA4 채널 리포트 조회에 실패했습니다.',
    })
  }
})

export default router
