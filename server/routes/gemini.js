import express from 'express'
import {
  generateContentWithKeyRotation,
  isGeminiQuotaExceeded,
  listGeminiApiKeys,
} from '../../lib/geminiKeys.js'

const router = express.Router()

const QUOTA_EXCEEDED_MESSAGE = 'AI 분석 일일 한도를 초과했습니다. 내일 다시 시도해주세요.'

function extractJsonObject(raw) {
  const t = String(raw ?? '').trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const body = fence ? fence[1].trim() : t
  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start === -1 || end <= start) throw new Error('Gemini 응답에서 JSON을 찾을 수 없습니다.')
  return body.slice(start, end + 1)
}

router.post('/analyze', async (req, res) => {
  if (listGeminiApiKeys().length === 0) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY가 설정되지 않았습니다.',
    })
  }

  const { analyticsData } = req.body || {}
  if (analyticsData == null) {
    return res.status(400).json({ error: 'analyticsData가 필요합니다.' })
  }

  try {
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
${JSON.stringify(analyticsData)}`

    const result = await generateContentWithKeyRotation({
      prompt,
      generationConfig: { responseMimeType: 'application/json' },
    })
    const text = result.response.text()
    const parsed = JSON.parse(extractJsonObject(text))

    if (typeof parsed.summary !== 'string' || !Array.isArray(parsed.highlights)) {
      throw new Error('Gemini 응답 형식이 올바르지 않습니다.')
    }
    if (!Array.isArray(parsed.recommendations)) {
      parsed.recommendations = []
    }

    parsed.generatedAt = new Date().toISOString()
    res.json(parsed)
  } catch (err) {
    console.error('[gemini/analyze]', err)
    if (isGeminiQuotaExceeded(err)) {
      return res.status(429).json({
        error: QUOTA_EXCEEDED_MESSAGE,
      })
    }

    res.status(500).json({
      error: err.message || 'Gemini 요청에 실패했습니다.',
    })
  }
})

export default router
