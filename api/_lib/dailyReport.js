import dayjs from 'dayjs'
import { getFirestore } from './firestore.js'
import {
  getGa4Client,
  runKpiForRange,
  fetchTrendData,
  fetchPageData,
  fetchChannelData,
} from './ga4.js'
import { analyzeWithGemini } from './gemini.js'

const COLLECTION = 'dailyReports'

export function getWindowBounds(now = dayjs()) {
  const windowStart =
    now.hour() >= 18
      ? now.startOf('day').hour(18)
      : now.subtract(1, 'day').startOf('day').hour(18)
  const windowEnd = windowStart.add(1, 'day')
  const key = windowStart.format('YYYY-MM-DD-HH')
  return { key, windowStart, windowEnd }
}

async function buildAnalyticsSnapshot(windowStart) {
  const { client, property } = await getGa4Client()
  const endDate = windowStart.format('YYYY-MM-DD')
  const startDate = windowStart.subtract(13, 'day').format('YYYY-MM-DD')
  const prevEnd = windowStart.subtract(14, 'day').format('YYYY-MM-DD')
  const prevStart = windowStart.subtract(27, 'day').format('YYYY-MM-DD')

  const [today, yesterday, trendData, pageData, channelData] = await Promise.all([
    runKpiForRange(client, property, startDate, endDate),
    runKpiForRange(client, property, prevStart, prevEnd),
    fetchTrendData(client, property, startDate, endDate),
    fetchPageData(client, property, startDate, endDate),
    fetchChannelData(client, property, startDate, endDate),
  ])

  return {
    dateRange: { startDate, endDate },
    kpiData: { today, yesterday },
    trendData,
    pageData,
    channelData,
  }
}

export async function getOrCreateDailyReport(now = dayjs()) {
  const bounds = getWindowBounds(now)
  const db = getFirestore()
  const ref = db.collection(COLLECTION).doc(bounds.key)
  const snap = await ref.get()
  if (snap.exists) return snap.data()

  const analyticsData = await buildAnalyticsSnapshot(bounds.windowStart)

  let insights = null
  let insightError = null
  try {
    insights = await analyzeWithGemini({
      kpiData: analyticsData.kpiData,
      pageData: analyticsData.pageData,
      channelData: analyticsData.channelData,
    })
  } catch (err) {
    insightError = String(err?.message || 'AI 분석에 실패했습니다.')
  }

  const report = {
    key: bounds.key,
    windowStart: bounds.windowStart.toISOString(),
    windowEnd: bounds.windowEnd.toISOString(),
    generatedAt: new Date().toISOString(),
    analyticsData,
    insights,
    insightError,
  }

  await ref.set(report)
  return report
}
