import { getGa4Client, fetchPageData } from '../_lib/ga4.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' })
  try {
    const { startDate, endDate } = req.query
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate, endDate 쿼리가 필요합니다.' })
    }
    const { client, property } = await getGa4Client()
    const out = await fetchPageData(client, property, startDate, endDate)
    return res.status(200).json(out)
  } catch (err) {
    return res.status(502).json({ error: err?.message || 'GA4 페이지 리포트 조회에 실패했습니다.' })
  }
}
