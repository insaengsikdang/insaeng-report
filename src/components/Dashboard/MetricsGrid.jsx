import {
  ShoppingCart, Users, TrendingUp, DollarSign,
  ArrowRightLeft, Clock, Monitor, Percent
} from 'lucide-react'
import KpiCard from './KpiCard'
import {
  formatNumber, formatCurrency, formatPercent, formatDuration
} from '../../utils/formatters'

export default function MetricsGrid({ kpiData, loading }) {
  if (loading) {
    return (
      <div className="kpi-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-kpi" />
        ))}
      </div>
    )
  }

  if (!kpiData) return null

  const { today, yesterday } = kpiData

  const cards = [
    {
      label: '총 세션',
      value: formatNumber(today.sessions),
      current: today.sessions,
      previous: yesterday.sessions,
      icon: Users,
      iconColor: '#ff6200',
      iconBg: 'rgba(255,98,0,0.12)',
    },
    {
      label: '거래 수',
      value: formatNumber(today.transactions),
      current: today.transactions,
      previous: yesterday.transactions,
      icon: ShoppingCart,
      iconColor: '#0f766e',
      iconBg: 'rgba(15,118,110,0.12)',
    },
    {
      label: '총 수익',
      value: formatCurrency(today.revenue),
      current: today.revenue,
      previous: yesterday.revenue,
      icon: DollarSign,
      iconColor: '#c2410c',
      iconBg: 'rgba(194,65,12,0.1)',
    },
    {
      label: '구매 전환율',
      value: formatPercent(today.conversionRate),
      current: today.conversionRate,
      previous: yesterday.conversionRate,
      icon: Percent,
      iconColor: '#475569',
      iconBg: 'rgba(71,85,105,0.1)',
    },
    {
      label: '이탈률',
      value: formatPercent(today.bounceRate),
      current: today.bounceRate,
      previous: yesterday.bounceRate,
      icon: ArrowRightLeft,
      iconColor: '#ef4444',
      iconBg: 'rgba(239,68,68,0.15)',
      invertChange: true, // 낮을수록 좋음
    },
    {
      label: '신규 사용자',
      value: formatNumber(today.newUsers),
      current: today.newUsers,
      previous: yesterday.newUsers,
      icon: TrendingUp,
      iconColor: '#0369a1',
      iconBg: 'rgba(3,105,161,0.1)',
    },
    {
      label: '평균 세션 시간',
      value: formatDuration(today.avgSessionDuration),
      current: today.avgSessionDuration,
      previous: yesterday.avgSessionDuration,
      icon: Clock,
      iconColor: '#64748b',
      iconBg: 'rgba(100,116,139,0.12)',
    },
    {
      label: '페이지뷰/세션',
      value: `${today.pageviewsPerSession.toFixed(1)}`,
      current: today.pageviewsPerSession,
      previous: yesterday.pageviewsPerSession,
      icon: Monitor,
      iconColor: '#334155',
      iconBg: 'rgba(51,65,85,0.1)',
    },
  ]

  return (
    <div className="kpi-grid">
      {cards.map((card, i) => (
        <KpiCard
          key={card.label}
          {...card}
          className={`fade-in fade-in-delay-${i + 1}`}
        />
      ))}
    </div>
  )
}
