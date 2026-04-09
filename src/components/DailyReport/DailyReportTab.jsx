import { Sparkles, AlertCircle } from 'lucide-react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import MetricsGrid from '../Dashboard/MetricsGrid'

dayjs.extend(utc)
dayjs.extend(timezone)

const KST = 'Asia/Seoul'
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

export default function DailyReportTab({ report, loading, error, onRefresh, onRerunAi }) {
  return (
    <div className="fade-in">
      <div className="dashboard-header">
        <div className="dashboard-title-group">
          <h1 className="dashboard-title">일간 리포트</h1>
          <p className="dashboard-subtitle">
            한국 시간(KST) 기준 당일 데이터 · GA4 + Gemini 자동 분석
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
              <div className="daily-report-label">리포트 구간 (KST)</div>
              <div className="daily-report-value">
                {dayjs(report.windowStart).tz(KST).format('YYYY-MM-DD HH:mm')} ~{' '}
                {dayjs(report.windowEnd).tz(KST).format('YYYY-MM-DD HH:mm')}
              </div>
            </div>
            <div>
              <div className="daily-report-label">생성 시각</div>
              <div className="daily-report-value">
                {dayjs(report.generatedAt).tz(KST).format('YYYY-MM-DD HH:mm:ss')}
              </div>
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
              <div className="error-state-desc">
                저장된 리포트에 이전 오류가 남아 있을 수 있습니다. 키·쿼터를 바꾼 뒤 아래로 다시 시도하세요.
              </div>
              <ul className="error-state-desc" style={{ marginTop: 8, paddingLeft: 20, textAlign: 'left' }}>
                <li>
                  <strong>429 / limit:0</strong>: Google AI Studio에서{' '}
                  <strong>다른 프로젝트(또는 계정)</strong>로 새 API 키를 만들고, `.env`의{' '}
                  <code>GEMINI_API_KEY</code> 또는 <code>GEMINI_API_KEY_FALLBACK</code>에 넣은 뒤 서버를 재시작하세요.
                </li>
                <li>같은 프로젝트 키를 두 개 써도 쿼터는 공유됩니다.</li>
              </ul>
              {typeof onRerunAi === 'function' && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onRerunAi()}
                  disabled={loading}
                  style={{ marginTop: 12 }}
                >
                  AI 분석 다시 시도 (GA + Gemini 재실행)
                </button>
              )}
              <details style={{ marginTop: 12, textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', opacity: 0.85 }}>기술 메시지 보기</summary>
                <pre
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    opacity: 0.9,
                  }}
                >
                  {report.insightError}
                </pre>
              </details>
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
