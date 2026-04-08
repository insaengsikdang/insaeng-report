import { Sparkles, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import dayjs from 'dayjs'

const TYPE_CONFIG = {
  warning: {
    icon: <AlertTriangle size={16} color="var(--warning)" />,
    cls: 'warning',
  },
  success: {
    icon: <CheckCircle size={16} color="var(--success)" />,
    cls: 'success',
  },
  info: {
    icon: <Info size={16} color="var(--info)" />,
    cls: 'info',
  },
}

// 마크다운 **bold** 처리 (간단 렌더링)
function renderBold(text) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  )
}

export default function InsightPanel({ insights, loading, error, onAnalyze }) {
  if (loading) {
    return (
      <div className="insight-section fade-in" id="gemini-insight-panel">
        <div className="insight-header">
          <div className="insight-badge">
            <Sparkles size={13} />
            Gemini AI 분석
          </div>
        </div>
        <div className="ai-loading">
          <div className="ai-loading-dots">
            <div className="ai-loading-dot" />
            <div className="ai-loading-dot" />
            <div className="ai-loading-dot" />
          </div>
          <span className="ai-loading-text">
            Gemini가 GA4 데이터를 분석하고 있습니다...
          </span>
        </div>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="insight-section fade-in" id="gemini-insight-panel">
        <div className="insight-header">
          <div className="insight-badge">
            <Sparkles size={13} />
            Gemini AI 분석
          </div>
        </div>
        <div className="card" style={{ padding: '32px 24px', textAlign: 'center' }}>
          <Sparkles size={32} color="var(--accent)" style={{ margin: '0 auto 12px' }} />
          {error && (
            <p
              style={{
                color: 'var(--danger)',
                marginBottom: 16,
                fontSize: '0.85rem',
                lineHeight: 1.5,
              }}
            >
              {error}
            </p>
          )}
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16, fontSize: '0.9rem' }}>
            {error
              ? '다시 시도하거나 API 키·네트워크를 확인해 주세요.'
              : 'AI 인사이트를 생성하려면 아래 버튼을 클릭하세요'}
          </p>
          <button id="run-ai-analysis-btn" type="button" className="btn btn-primary" onClick={onAnalyze}>
            <Sparkles size={14} />
            {error ? '다시 분석' : 'AI 분석 시작'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="insight-section fade-in" id="gemini-insight-panel">
      <div className="insight-header">
        <div className="insight-badge">
          <Sparkles size={13} />
          Gemini AI 분석
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          생성: {dayjs(insights.generatedAt).format('HH:mm')}
        </span>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ fontSize: '0.75rem', padding: '4px 10px' }}
          onClick={onAnalyze}
        >
          재생성
        </button>
      </div>

      {/* 요약 */}
      <div className="insight-summary-card fade-in fade-in-delay-1">
        {renderBold(insights.summary)}
      </div>

      {/* 하이라이트 카드들 */}
      <div className="insight-cards-grid">
        {(insights.highlights ?? []).map((item, i) => {
          const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.info
          return (
            <div key={i} className={`insight-card ${config.cls} fade-in fade-in-delay-${i + 2}`}>
              <div className="insight-card-header">
                <span className="insight-card-icon">{config.icon}</span>
                <span className="insight-card-title">{item.title}</span>
              </div>
              <p className="insight-card-desc">{item.description}</p>
              {item.pages?.length > 0 && (
                <div className="insight-pages">
                  {item.pages.map((p) => (
                    <span key={p} className="insight-page-tag">{p}</span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 개선 제안 */}
      <div className="recommendations-card fade-in fade-in-delay-5">
        <div className="recommendations-title">🎯 개선 우선순위 제안</div>
        <ul className="recommendations-list">
          {(insights.recommendations ?? []).map((rec, i) => (
            <li key={i} className="recommendations-item">
              <span className="recommendations-num">{i + 1}</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
