import { BarChart2, RefreshCw } from 'lucide-react'
import dayjs from 'dayjs'

export default function Header({ onRefresh, loading }) {
  const today = dayjs().format('YYYY년 M월 D일 dddd')

  return (
    <header className="header">
      <a className="header-logo" href="/">
        <div className="header-logo-icon">
          <BarChart2 size={18} color="#fff" />
        </div>
        <span className="header-logo-text">
          인생<span>리포트</span>
        </span>
      </a>

      <div className="header-center">
        <div className="header-badge">
          <div className="header-badge-dot" />
          GA4 실시간 연결
        </div>
      </div>

      <div className="header-actions">
        <div className="header-date">{today}</div>
        <button
          id="header-refresh-btn"
          type="button"
          className="btn btn-secondary btn-icon"
          onClick={onRefresh}
          disabled={loading}
          title="새로고침"
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
        </button>
      </div>
    </header>
  )
}
