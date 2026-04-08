import { useCallback, useEffect, useState } from 'react'
import { fetchCurrentDailyReport } from '../api/dailyReportClient'

export const useDailyReport = () => {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchCurrentDailyReport()
      setReport(data)
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        '일간 리포트를 불러오는 중 오류가 발생했습니다.'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { report, loading, error, refresh }
}
