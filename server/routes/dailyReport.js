import express from 'express'
import path from 'path'
import dayjs from 'dayjs'
import { google } from 'googleapis'
import { getFirestore } from '../lib/firestore.js'
import { getDailyReportWindow } from '../../lib/seoulDay.js'
import { generateContentWithKeyRotation, listGeminiApiKeys } from '../../lib/geminiKeys.js'

const router = express.Router()
const COLLECTION = 'dailyReports'

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

async function getDataClient() {
  const rawPid = (process.env.GA4_PROPERTY_ID || '').trim()
  const keyRel = (process.env.GA4_KEY_FILE || '').trim()
  const property = normalizePropertyId(rawPid)
  if (!property || !keyRel) {
    throw new Error('GA4 환경변수가 비어 있습니다.')
  }

  const keyFile = path.resolve(process.cwd(), keyRel)
  const auth = new google.auth.GoogleAuth({
    keyFile,
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
  })
  const authClient = await auth.getClient()
  return {
    client: google.analyticsdata({ version: 'v1beta', auth: authClient }),
    property,
  }
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

async function fetchAnalyticsSnapshot(reportDate) {
  const { client, property } = await getDataClient()
  const endDate = reportDate
  const prevDate = dayjs(reportDate).subtract(1, 'day').format('YYYY-MM-DD')
  const trendStart = dayjs(reportDate).subtract(13, 'day').format('YYYY-MM-DD')

  const [kpiToday, kpiYesterday, trendRes, pagesRes, channelsRes] = await Promise.all([
    client.properties.runReport({
      property,
      requestBody: { dateRanges: [{ startDate: endDate, endDate }], metrics: KPI_METRICS },
    }),
    client.properties.runReport({
      property,
      requestBody: { dateRanges: [{ startDate: prevDate, endDate: prevDate }], metrics: KPI_METRICS },
    }),
    client.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate: trendStart, endDate }],
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
    }),
    client.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate: endDate, endDate }],
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
    }),
    client.properties.runReport({
      property,
      requestBody: {
        dateRanges: [{ startDate: endDate, endDate }],
        dimensions: [{ name: 'sessionDefaultChannelGrouping' }],
        metrics: [
          { name: 'sessions' },
          { name: 'transactions' },
          { name: 'totalRevenue' },
        ],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
        limit: 15,
      },
    }),
  ])

  const trendData = (trendRes.data.rows || []).map((row) => ({
    date: row.dimensionValues?.[0]?.value || '',
    sessions: Math.round(metricAt(row, 0)),
    transactions: Math.round(metricAt(row, 1)),
    revenue: Math.round(metricAt(row, 2)),
    bounceRate: normalizeBounceRate(metricAt(row, 3)),
    newUsers: Math.round(metricAt(row, 4)),
  }))

  const pageData = (pagesRes.data.rows || []).map((row) => {
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

  const channelData = (channelsRes.data.rows || []).map((row) => {
    const sessions = Math.round(metricAt(row, 0))
    const transactions = Math.round(metricAt(row, 1))
    return {
      channel: row.dimensionValues?.[0]?.value || '(not set)',
      sessions,
      revenue: Math.round(metricAt(row, 2)),
      conversionRate: sessions > 0 ? Number(((transactions / sessions) * 100).toFixed(2)) : 0,
    }
  })

  return {
    dateRange: { startDate: trendStart, endDate },
    reportDate: endDate,
    kpiData: {
      today: rowToKpi(kpiToday.data.rows?.[0]),
      yesterday: rowToKpi(kpiYesterday.data.rows?.[0]),
    },
    trendData,
    pageData,
    channelData,
  }
}

function extractJsonObject(raw) {
  const t = String(raw ?? '').trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const body = fence ? fence[1].trim() : t
  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start === -1 || end <= start) throw new Error('Gemini 응답에서 JSON을 찾을 수 없습니다.')
  return body.slice(start, end + 1)
}

async function runGeminiAnalysis(analyticsData) {
  if (listGeminiApiKeys().length === 0) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.')
  }

  const payload = {
    kpiData: analyticsData?.kpiData,
    pageData: Array.isArray(analyticsData?.pageData) ? analyticsData.pageData.slice(0, 15) : analyticsData?.pageData,
    channelData: Array.isArray(analyticsData?.channelData)
      ? analyticsData.channelData.slice(0, 12)
      : analyticsData?.channelData,
  }

  const prompt = `당신은 이커머스 GA4 대시보드 데이터를 해석하는 애널리틱스 어시스턴트입니다.
아래 JSON은 KPI(오늘/어제), 페이지별·채널별 요약 데이터입니다.

반드시 JSON만 출력하세요(앞뒤 설명·마크다운 코드펜스 금지). 키 구조는 다음과 같아야 합니다:
{
  "summary": "2~4문장 한국어 요약. 중요 수치는 **굵게** 표시",
  "highlights": [
    { "type": "warning"|"success"|"info", "title": "짧은 제목", "description": "근거 있는 설명", "pages": ["/path"] }
  ],
  "recommendations": [ "실행 가능한 한국어 제안 문자열" ]
}

highlights는 데이터가 허용하면 3개 전후로 구성하고, pages는 해당되면 경로 배열, 없으면 [].

데이터:
${JSON.stringify(payload)}`

  const result = await generateContentWithKeyRotation({
    prompt,
    generationConfig: { responseMimeType: 'application/json' },
  })
  let parsed
  try {
    parsed = JSON.parse(extractJsonObject(result.response.text()))
  } catch (e) {
    throw new Error(`Gemini JSON 파싱 실패: ${e.message || e}`)
  }
  if (!Array.isArray(parsed.recommendations)) parsed.recommendations = []
  return parsed
}

async function generateReportForWindow(bounds, options = {}) {
  const refreshInsights = Boolean(options.refreshInsights)
  const db = getFirestore()
  const ref = db.collection(COLLECTION).doc(bounds.key)
  const snap = await ref.get()
  if (snap.exists && !refreshInsights) return snap.data()

  const analyticsData = await fetchAnalyticsSnapshot(bounds.reportDate)
  let insights = null
  let insightError = null
  try {
    insights = await runGeminiAnalysis({
      kpiData: analyticsData.kpiData,
      pageData: analyticsData.pageData,
      channelData: analyticsData.channelData,
    })
  } catch (err) {
    insightError = String(err?.message || 'AI 분석에 실패했습니다.')
  }

  const report = {
    key: bounds.key,
    reportDate: bounds.reportDate,
    windowStart: bounds.windowStart,
    windowEnd: bounds.windowEnd,
    generatedAt: new Date().toISOString(),
    analyticsData,
    insights,
    insightError,
  }

  await ref.set(report)
  return report
}

let schedulerStarted = false

export async function startDailyReportScheduler() {
  if (schedulerStarted) return
  schedulerStarted = true

  const ensureCurrent = async () => {
    try {
      await generateReportForWindow(getDailyReportWindow(), { refreshInsights: false })
    } catch (err) {
      console.error('[daily-report/scheduler]', err?.message || err)
    }
  }

  await ensureCurrent()
  setInterval(ensureCurrent, 60 * 1000)
}

function parseRefreshInsightsQuery(query) {
  const q = query?.refreshInsights ?? query?.refresh_insights
  return ['1', 'true', 'yes'].includes(String(q ?? '').toLowerCase())
}

router.get('/current', async (req, res) => {
  try {
    const refreshInsights = parseRefreshInsightsQuery(req.query)
    const report = await generateReportForWindow(getDailyReportWindow(), { refreshInsights })
    res.json(report)
  } catch (err) {
    console.error('[daily-report/current]', err)
    res.status(500).json({ error: err?.message || '일간 리포트 생성에 실패했습니다.' })
  }
})

export default router
