import { Sparkles, AlertCircle } from 'lucide-react'
import dayjs from 'dayjs'
import MetricsGrid from '../Dashboard/MetricsGrid'
import { TrendChart, RevenueChart } from '../Dashboard/RevenueChart'
import ChannelCard from '../Dashboard/ChannelCard'
import PageTable from '../Dashboard/PageTable'

const TYPE_CLASS = {
  warning: 'warning',
  success: 'success',
  info: 'info',
}

function renderBold(text) {
  const parts = String(text || '').split(/\*\*(.*?)\*\*/g)
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))
}

export default function DailyReportTab({ report, loading, error, onRefresh }) {
  return (
    <div className="fade-in">
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <h1 className="dashboard-title">일간 리포트</h1>
          <p className="dashboard-subtitle">
            매일 오후 6시에 자동 생성되는 GA4 + Gemini 분석 결과
          </p>
        </div>
      </div>

      {loading && (
        <div className="card ai-loading">
          <div className="ai-loading-dots">
            <div className="ai-loading-dot" />
            <div className="ai-loading-dot" />
            <div className="ai-loading-dot" />
          </div>
          <span className="ai-loading-text">일간 리포트를 불러오는 중입니다...</span>
        </div>
      )}

      {error && (
        <div className="card error-state">
          <AlertCircle size={32} className="error-state-icon" />
          <div className="error-state-title">일간 리포트 로드 실패</div>
          <div className="error-state-desc">{error}</div>
          <button type="button" className="btn btn-secondary" onClick={onRefresh} style={{ marginTop: 12 }}>
            다시 시도
          </button>
        </div>
      )}

      {!loading && !error && report && (
        <>
          <div className="card daily-report-meta">
            <div>
              <div className="daily-report-label">리포트 구간</div>
              <div className="daily-report-value">
                {dayjs(report.windowStart).format('YYYY-MM-DD HH:mm')} ~{' '}
                {dayjs(report.windowEnd).format('YYYY-MM-DD HH:mm')}
              </div>
            </div>
            <div>
              <div className="daily-report-label">생성 시각</div>
              <div className="daily-report-value">{dayjs(report.generatedAt).format('YYYY-MM-DD HH:mm:ss')}</div>
            </div>
          </div>

          <section style={{ marginTop: 16 }}>
            <div className="dashboard-header" style={{ marginBottom: 16 }}>
              <div className="dashboard-title-group">
                <h2 className="dashboard-title" style={{ fontSize: '1.3rem' }}>일간 대시보드 요약</h2>
                <p className="dashboard-subtitle">
                  저장된 리포트 시점의 GA4 지표입니다.
                </p>
              </div>
            </div>

            <MetricsGrid kpiData={report.analyticsData?.kpiData} loading={false} />

            <div className="chart-section">
              <TrendChart data={report.analyticsData?.trendData || []} loading={false} />
              <ChannelCard data={report.analyticsData?.channelData || []} loading={false} />
            </div>

            <div style={{ marginBottom: 24 }}>
              <RevenueChart data={report.analyticsData?.trendData || []} loading={false} />
            </div>

            <PageTable data={report.analyticsData?.pageData || []} loading={false} />
          </section>

          {report.insightError ? (
            <div className="card error-state" style={{ marginTop: 24 }}>
              <AlertCircle size={26} className="error-state-icon" />
              <div className="error-state-title">AI 분석 실패</div>
              <div className="error-state-desc">일일 AI 분석에 실패했습니다. 다음 생성 주기에 다시 시도됩니다.</div>
            </div>
          ) : (
            <section className="insight-section" style={{ marginTop: 24 }}>
              <div className="insight-header">
                <div className="insight-badge">
                  <Sparkles size={13} />
                  Gemini AI 일간 분석
                </div>
              </div>

              <div className="insight-summary-card">{renderBold(report.insights?.summary || '')}</div>

              <div className="insight-cards-grid">
                {(report.insights?.highlights || []).map((item, i) => (
                  <div key={i} className={`insight-card ${TYPE_CLASS[item.type] || 'info'}`}>
                    <div className="insight-card-title">{item.title}</div>
                    <p className="insight-card-desc">{item.description}</p>
                    {item.pages?.length > 0 && (
                      <div className="insight-pages">
                        {item.pages.map((p) => (
                          <span key={p} className="insight-page-tag">{p}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="recommendations-card">
                <div className="recommendations-title">개선 제안</div>
                <ul className="recommendations-list">
                  {(report.insights?.recommendations || []).map((rec, i) => (
                    <li key={i} className="recommendations-item">
                      <span className="recommendations-num">{i + 1}</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
