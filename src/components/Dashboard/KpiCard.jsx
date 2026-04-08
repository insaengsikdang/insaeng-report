import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatChange } from '../../utils/formatters'

/**
 * @param {string}  label      - KPI 이름
 * @param {string}  value      - 포맷된 현재 값
 * @param {number}  current    - 변화율 계산용 원래 값
 * @param {number}  previous   - 전일 값
 * @param {string}  icon       - lucide-react 아이콘 컴포넌트
 * @param {string}  iconBg     - 아이콘 배경색
 * @param {boolean} invertChange - true면 상승이 나쁜 지표 (이탈률 등)
 * @param {string}  className
 */
export default function KpiCard({
  label,
  value,
  current,
  previous,
  icon: Icon,
  iconColor = '#ff6200',
  iconBg = 'rgba(255,98,0,0.12)',
  invertChange = false,
  className = '',
}) {
  const change = formatChange(current, previous)
  // invertChange: 이탈률처럼 낮을수록 좋은 지표는 반전
  const isPositive = invertChange ? !change.positive : change.positive

  return (
    <div className={`kpi-card fade-in ${className}`}>
      <div
        className="kpi-card-icon-wrapper"
        style={{ background: iconBg }}
      >
        {Icon && <Icon size={20} color={iconColor} strokeWidth={2.2} />}
      </div>

      <div className="kpi-card-label">{label}</div>
      <div className="kpi-card-value">{value}</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span className={`kpi-card-change ${isPositive ? 'positive' : 'negative'}`}>
          {isPositive
            ? <TrendingUp size={11} />
            : change.positive === null
            ? <Minus size={11} />
            : <TrendingDown size={11} />
          }
          {change.value}
        </span>
        <span className="kpi-card-change-label">전일 대비</span>
      </div>
    </div>
  )
}
