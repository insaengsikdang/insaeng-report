import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 60000,
})

/** @param {{ refreshInsights?: boolean }} [opts] refreshInsights=true 이면 GA 재수집 + Gemini 재호출 후 Firestore 갱신 */
export const fetchCurrentDailyReport = async (opts = {}) => {
  const params = {}
  if (opts.refreshInsights) params.refreshInsights = '1'
  const { data } = await api.get('/daily-report/current', {
    params,
    timeout: opts.refreshInsights ? 120000 : 60000,
  })
  return data
}
