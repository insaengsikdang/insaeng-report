import { useState, useEffect, useCallback } from 'react'
import dayjs from 'dayjs'
import { fetchKpiMetrics, fetchTrendData, fetchPageData, fetchChannelData } from '../api/analyticsClient'

export const useAnalytics = () => {
  const [dateRange, setDateRange] = useState({
    startDate: dayjs().subtract(13, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  })
  const [kpiData, setKpiData] = useState(null)
  const [trendData, setTrendData] = useState([])
  const [pageData, setPageData] = useState([])
  const [channelData, setChannelData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { startDate, endDate } = dateRange
      const [kpi, trend, pages, channels] = await Promise.all([
        fetchKpiMetrics(startDate, endDate),
        fetchTrendData(startDate, endDate),
        fetchPageData(startDate, endDate),
        fetchChannelData(startDate, endDate),
      ])
      setKpiData(kpi)
      setTrendData(trend)
      setPageData(pages)
      setChannelData(channels)
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        '데이터를 불러오는 중 오류가 발생했습니다.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
      console.error('Analytics fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return {
    kpiData,
    trendData,
    pageData,
    channelData,
    loading,
    error,
    dateRange,
    setDateRange,
    refresh: fetchAll,
  }
}
