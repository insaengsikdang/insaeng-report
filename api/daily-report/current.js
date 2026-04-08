import { getOrCreateDailyReport } from '../_lib/dailyReport.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' })
  try {
    const report = await getOrCreateDailyReport()
    return res.status(200).json(report)
  } catch (err) {
    return res.status(500).json({ error: err?.message || '일간 리포트 생성에 실패했습니다.' })
  }
}
