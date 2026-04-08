import path from 'path'
import { google } from 'googleapis'

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
  return s.startsWith('properties/') ? s : `properties/${s}`
}

function metricAt(row, i) {
  const raw = row?.metricValues?.[i]?.value
  if (raw === undefined || raw === null || raw === '') return 0
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

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

export function formatGaDate(d) {
  if (!d || String(d).length !== 8) return String(d)
  const s = String(d)
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}

export async function getGa4Client() {
  const rawPid = (process.env.GA4_PROPERTY_ID || '').trim()
  const keyRel = (process.env.GA4_KEY_FILE || '').trim()
  const keyJsonRaw = (process.env.GA4_SERVICE_ACCOUNT_JSON || '').trim()
  const property = normalizePropertyId(rawPid)
  if (!property || (!keyRel && !keyJsonRaw)) {
    throw new Error('GA4 환경변수가 비어 있습니다.')
  }

  let auth
  if (keyJsonRaw) {
    let credentials
    try {
      credentials = JSON.parse(keyJsonRaw)
    } catch {
      throw new Error('GA4_SERVICE_ACCOUNT_JSON 형식이 올바르지 않습니다.')
    }
    auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    })
  } else {
    const keyFile = path.resolve(process.cwd(), keyRel)
    auth = new google.auth.GoogleAuth({
      keyFile,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    })
  }

  const authClient = await auth.getClient()
  return {
    property,
    client: google.analyticsdata({ version: 'v1beta', auth: authClient }),
  }
}

export async function runKpiForRange(client, property, startDate, endDate) {
  const { data } = await client.properties.runReport({
    property,
    requestBody: { dateRanges: [{ startDate, endDate }], metrics: KPI_METRICS },
  })
  return rowToKpi(data.rows?.[0])
}

export async function fetchTrendData(client, property, startDate, endDate) {
  const { data } = await client.properties.runReport({
    property,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
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
    const date = formatGaDate(row.dimensionValues?.[0]?.value)
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
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10)
    out.push(byDate.get(key) || { date: key, sessions: 0, transactions: 0, revenue: 0, bounceRate: 0, newUsers: 0 })
  }
  return out
}

export async function fetchPageData(client, property, startDate, endDate) {
  const { data } = await client.properties.runReport({
    property,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
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

  return (data.rows || []).map((row) => {
    const sessions = Math.round(metricAt(row, 0))
    const transactions = Math.round(metricAt(row, 1))
    return {
      pagePath: row.dimensionValues?.[0]?.value || '(not set)',
      sessions,
      transactions,
      revenue: Math.round(metricAt(row, 2)),
      bounceRate: normalizeBounceRate(metricAt(row, 3)),
      conversionRate: sessions > 0 ? Number(((transactions / sessions) * 100).toFixed(2)) : 0,
    }
  })
}

export async function fetchChannelData(client, property, startDate, endDate) {
  const { data } = await client.properties.runReport({
    property,
    requestBody: {
      dateRanges: [{ startDate, endDate }],
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

  return (data.rows || []).map((row) => {
    const sessions = Math.round(metricAt(row, 0))
    const transactions = Math.round(metricAt(row, 1))
    return {
      channel: row.dimensionValues?.[0]?.value || '(not set)',
      sessions,
      revenue: Math.round(metricAt(row, 2)),
      conversionRate: sessions > 0 ? Number(((transactions / sessions) * 100).toFixed(2)) : 0,
    }
  })
}
