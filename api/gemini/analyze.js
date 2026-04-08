import {
  analyzeWithGemini,
  isGeminiQuotaExceeded,
  QUOTA_EXCEEDED_MESSAGE,
} from '../_lib/gemini.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' })
  try {
    const { analyticsData } = req.body || {}
    if (analyticsData == null) {
      return res.status(400).json({ error: 'analyticsData가 필요합니다.' })
    }
    const parsed = await analyzeWithGemini(analyticsData)
    return res.status(200).json(parsed)
  } catch (err) {
    if (isGeminiQuotaExceeded(err)) {
      return res.status(429).json({ error: QUOTA_EXCEEDED_MESSAGE })
    }
    return res.status(err?.status || 500).json({
      error: err?.message || 'Gemini 요청에 실패했습니다.',
    })
  }
}
