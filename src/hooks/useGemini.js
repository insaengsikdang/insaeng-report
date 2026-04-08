import { useState, useCallback } from 'react'
import { fetchGeminiInsights } from '../api/geminiClient'

const QUOTA_EXCEEDED_MESSAGE = 'AI 분석 일일 한도를 초과했습니다. 내일 다시 시도해주세요.'

function normalizeGeminiError(err) {
  const apiMessage = err?.response?.data?.error
  const rawMessage =
    typeof apiMessage === 'string'
      ? apiMessage
      : typeof err?.message === 'string'
        ? err.message
        : 'AI 분석 중 오류가 발생했습니다.'

  const normalized = rawMessage.toLowerCase()
  if (
    err?.response?.status === 429 ||
    normalized.includes('quota exceeded') ||
    normalized.includes('too many requests') ||
    normalized.includes('rate limit')
  ) {
    return QUOTA_EXCEEDED_MESSAGE
  }

  return rawMessage
}

export const useGemini = () => {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const analyze = useCallback(async (analyticsData) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchGeminiInsights(analyticsData)
      setInsights(result)
    } catch (err) {
      setError(normalizeGeminiError(err))
      console.error('Gemini error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  return { insights, loading, error, analyze }
}
