import { GoogleGenerativeAI } from '@google/generative-ai'

const MODEL = process.env.GEMINI_MODEL?.trim() || 'gemini-2.0-flash'
export const QUOTA_EXCEEDED_MESSAGE = 'AI 분석 일일 한도를 초과했습니다. 내일 다시 시도해주세요.'

export function isGeminiQuotaExceeded(err) {
  const msg = String(err?.message || '').toLowerCase()
  return (
    err?.status === 429 ||
    msg.includes('quota exceeded') ||
    msg.includes('too many requests') ||
    msg.includes('rate limit')
  )
}

export async function analyzeWithGemini(analyticsData) {
  const key = (process.env.GEMINI_API_KEY || '').trim()
  if (!key) {
    const e = new Error('GEMINI_API_KEY가 설정되지 않았습니다.')
    e.status = 503
    throw e
  }

  const genAI = new GoogleGenerativeAI(key)
  const model = genAI.getGenerativeModel({
    model: MODEL,
    generationConfig: { responseMimeType: 'application/json' },
  })

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

  const result = await model.generateContent(prompt)
  const parsed = JSON.parse(result.response.text())
  if (typeof parsed.summary !== 'string' || !Array.isArray(parsed.highlights)) {
    throw new Error('Gemini 응답 형식이 올바르지 않습니다.')
  }
  if (!Array.isArray(parsed.recommendations)) parsed.recommendations = []
  parsed.generatedAt = new Date().toISOString()
  return parsed
}
