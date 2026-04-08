import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

/**
 * Gemini로 GA4 데이터 분석 요청
 * @param {Object} analyticsData - GA4에서 수집한 데이터 객체
 */
export const fetchGeminiInsights = async (analyticsData) => {
  const { data } = await api.post('/gemini/analyze', { analyticsData })
  return data
}
