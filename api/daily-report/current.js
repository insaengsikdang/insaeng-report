import { getOrCreateDailyReport } from '../_lib/dailyReport.js'

function parseRefreshInsights(query) {
  const q = query?.refreshInsights ?? query?.refresh_insights
  return ['1', 'true', 'yes'].includes(String(q ?? '').toLowerCase())
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' })
  try {
    const refreshInsights = parseRefreshInsights(req.query || {})
    const report = await getOrCreateDailyReport(new Date(), { refreshInsights })
    return res.status(200).json(report)
  } catch (err) {
    return res.status(500).json({ error: err?.message || '일간 리포트 생성에 실패했습니다.' })
  }
}
