import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

/**
 * GA4 주요 KPI 데이터 조회
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate   - YYYY-MM-DD
 */
export const fetchKpiMetrics = async (startDate, endDate) => {
  const { data } = await api.get('/analytics/kpi', {
    params: { startDate, endDate },
  })
  return data
}

/**
 * 일별 트렌드 데이터 조회 (차트용)
 * @param {string} startDate
 * @param {string} endDate
 */
export const fetchTrendData = async (startDate, endDate) => {
  const { data } = await api.get('/analytics/trend', {
    params: { startDate, endDate },
  })
  return data
}

/**
 * 페이지별 성과 데이터 조회
 * @param {string} startDate
 * @param {string} endDate
 */
export const fetchPageData = async (startDate, endDate) => {
  const { data } = await api.get('/analytics/pages', {
    params: { startDate, endDate },
  })
  return data
}

/**
 * 채널별 성과 데이터 조회
 */
export const fetchChannelData = async (startDate, endDate) => {
  const { data } = await api.get('/analytics/channels', {
    params: { startDate, endDate },
  })
  return data
}
