import { useState } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import Header from './components/Layout/Header'
import MetricsGrid from './components/Dashboard/MetricsGrid'
import { TrendChart, RevenueChart } from './components/Dashboard/RevenueChart'
import ChannelCard from './components/Dashboard/ChannelCard'
import PageTable from './components/Dashboard/PageTable'
import DateRangePicker from './components/Dashboard/DateRangePicker'
import { useAnalytics } from './hooks/useAnalytics'
import { useDailyReport } from './hooks/useDailyReport'
import DailyReportTab from './components/DailyReport/DailyReportTab'
import dayjs from 'dayjs'
import 'dayjs/locale/ko'

dayjs.locale('ko')

export default function App() {
  const [activeTab, setActiveTab] = useState('daily')
  const {
    kpiData, trendData, pageData, channelData,
    loading, error, dateRange, setDateRange, refresh,
  } = useAnalytics()
  const {
    report: dailyReport,
    loading: dailyLoading,
    error: dailyError,
    refresh: refreshDailyReport,
    rerunAiAnalysis: rerunDailyAiAnalysis,
  } = useDailyReport()

  const handleHeaderRefresh = () => {
    if (activeTab === 'daily') {
      refreshDailyReport()
      return
    }
    refresh()
  }

  const handleTabChange = (tab) => setActiveTab(tab)

  return (
    <div className="app-layout">
      <Header onRefresh={handleHeaderRefresh} loading={activeTab === 'daily' ? dailyLoading : loading} />

      <main className="main-content">
        <div className="top-tabs">
          <button
            type="button"
            className={`top-tab-btn ${activeTab === 'daily' ? 'active' : ''}`}
            onClick={() => handleTabChange('daily')}
          >
            일간 리포트
          </button>
          <button
            type="button"
            className={`top-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleTabChange('dashboard')}
          >
            대시보드
          </button>
        </div>

        {activeTab === 'daily' && (
          <DailyReportTab
            report={dailyReport}
            loading={dailyLoading}
            error={dailyError}
            onRefresh={refreshDailyReport}
            onRerunAi={rerunDailyAiAnalysis}
          />
        )}

        {activeTab === 'dashboard' && (
          <>
            {/* 대시보드 헤더 */}
            <div className="dashboard-header">
              <div className="dashboard-title-group">
                <h1 className="dashboard-title">이커머스 대시보드</h1>
                <p className="dashboard-subtitle">
                  Google Analytics 4 기반 성과 지표
                </p>
              </div>
              <div className="dashboard-controls">
                <DateRangePicker
                  startDate={dateRange.startDate}
                  endDate={dateRange.endDate}
                  onChange={setDateRange}
                />
                <button
                  id="refresh-data-btn"
                  type="button"
                  className="btn btn-secondary"
                  onClick={refresh}
                  disabled={loading}
                >
                  <RefreshCw size={14} className={loading ? 'spin' : ''} />
                  새로고침
                </button>
              </div>
            </div>

            {/* 에러 상태 */}
            {error && (
              <div className="card error-state fade-in" style={{ marginBottom: 24 }}>
                <AlertCircle size={32} className="error-state-icon" />
                <div className="error-state-title">데이터 로드 실패</div>
                <div className="error-state-desc">{error}</div>
                <button type="button" className="btn btn-secondary" onClick={refresh} style={{ marginTop: 12 }}>
                  재시도
                </button>
              </div>
            )}

            {/* KPI 카드 그리드 */}
            <MetricsGrid kpiData={kpiData} loading={loading} />

            {/* 차트 섹션 */}
            <div className="chart-section">
              <TrendChart data={trendData} loading={loading} />
              <ChannelCard data={channelData} loading={loading} />
            </div>

            {/* 수익 차트 */}
            <div style={{ marginBottom: 24 }}>
              <RevenueChart data={trendData} loading={loading} />
            </div>

            {/* 페이지별 성과 테이블 */}
            <PageTable data={pageData} loading={loading} />
          </>
        )}

        {/* 하단 여백 */}
        <div style={{ height: 40 }} />
      </main>
    </div>
  )
}
