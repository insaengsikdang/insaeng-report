import dayjs from 'dayjs'
import { getGa4Client, runKpiForRange } from '../_lib/ga4.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' })
  try {
    const { startDate, endDate } = req.query
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate, endDate 쿼리가 필요합니다.' })
    }
    const start = dayjs(startDate)
    const end = dayjs(endDate)
    if (!start.isValid() || !end.isValid() || start.isAfter(end, 'day')) {
      return res.status(400).json({ error: 'startDate/endDate 형식이 올바르지 않습니다.' })
    }

    const days = end.diff(start, 'day') + 1
    const prevEnd = start.subtract(1, 'day')
    const prevStart = prevEnd.subtract(days - 1, 'day')
    const { client, property } = await getGa4Client()

    const [today, yesterday] = await Promise.all([
      runKpiForRange(client, property, startDate, endDate),
      runKpiForRange(client, property, prevStart.format('YYYY-MM-DD'), prevEnd.format('YYYY-MM-DD')),
    ])

    return res.status(200).json({ today, yesterday })
  } catch (err) {
    return res.status(502).json({ error: err?.message || 'GA4 KPI 조회에 실패했습니다.' })
  }
}
