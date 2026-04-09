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
import { getDailyReportWindow } from '../../lib/seoulDay.js'

const COLLECTION = 'dailyReports'

export { getDailyReportWindow }

/**
 * reportDate: 서울 기준 YYYY-MM-DD (그날 하루)
 * - KPI: 해당일 vs 전일 (각각 하루)
 * - 트렌드: 최근 14일(당일 포함)
 * - 페이지/채널: 해당일 하루만
 */
async function buildAnalyticsSnapshot(reportDate) {
  const { client, property } = await getGa4Client()
  const endDate = reportDate
  const prevDate = dayjs(reportDate).subtract(1, 'day').format('YYYY-MM-DD')
  const trendStart = dayjs(reportDate).subtract(13, 'day').format('YYYY-MM-DD')

  const [today, yesterday, trendData, pageData, channelData] = await Promise.all([
    runKpiForRange(client, property, endDate, endDate),
    runKpiForRange(client, property, prevDate, prevDate),
    fetchTrendData(client, property, trendStart, endDate),
    fetchPageData(client, property, endDate, endDate),
    fetchChannelData(client, property, endDate, endDate),
  ])

  return {
    dateRange: { startDate: trendStart, endDate },
    reportDate,
    kpiData: { today, yesterday },
    trendData,
    pageData,
    channelData,
  }
}

export async function getOrCreateDailyReport(now = new Date(), options = {}) {
  const refreshInsights = Boolean(options.refreshInsights)
  const bounds = getDailyReportWindow(now)
  const db = getFirestore()
  const ref = db.collection(COLLECTION).doc(bounds.key)
  const snap = await ref.get()
  if (snap.exists && !refreshInsights) return snap.data()

  const analyticsData = await buildAnalyticsSnapshot(bounds.reportDate)

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
