import { getOrCreateDailyReport } from '../_lib/dailyReport.js'

function isAuthorized(req) {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  return req.headers.authorization === `Bearer ${secret}`
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' })
  if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const report = await getOrCreateDailyReport()
    return res.status(200).json({
      ok: true,
      key: report.key,
      generatedAt: report.generatedAt,
    })
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || 'cron failed' })
  }
}
