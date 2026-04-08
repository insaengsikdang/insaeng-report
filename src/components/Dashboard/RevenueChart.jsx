import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts'
import { formatDate, formatCurrency, formatNumber } from '../../utils/formatters'

const C_ACCENT = '#ff6200'
const C_SECOND = '#64748b'
const GRID_STROKE = 'rgba(15, 23, 42, 0.08)'

// 커스텀 툴팁
const CustomTooltip = ({ active, payload, label, type }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: '10px 14px',
      fontSize: '0.8rem',
    }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} style={{ color: entry.color, marginBottom: 2 }}>
          <span style={{ color: 'var(--text-secondary)', marginRight: 6 }}>{entry.name}:</span>
          {type === 'revenue'
            ? formatCurrency(entry.value)
            : formatNumber(entry.value)}
        </div>
      ))}
    </div>
  )
}

export function TrendChart({ data, loading }) {
  if (loading) return <div className="skeleton skeleton-chart" />
  if (!data?.length) return null

  const chartData = data.map(d => ({
    ...d,
    날짜: formatDate(d.date),
  }))

  return (
    <div className="card chart-card fade-in">
      <div className="chart-header">
        <span className="chart-title">세션 & 거래 추이</span>
        <div className="chart-legend">
          <div className="chart-legend-item">
            <div className="chart-legend-dot" style={{ background: C_ACCENT }} />
            세션
          </div>
          <div className="chart-legend-item">
            <div className="chart-legend-dot" style={{ background: C_SECOND }} />
            거래
          </div>
        </div>
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradSessions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C_ACCENT} stopOpacity={0.35} />
                <stop offset="95%" stopColor={C_ACCENT} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradTransactions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C_SECOND} stopOpacity={0.28} />
                <stop offset="95%" stopColor={C_SECOND} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis
              dataKey="날짜"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="sessions"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${(v/1000).toFixed(1)}k`}
            />
            <YAxis
              yAxisId="transactions"
              orientation="right"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              yAxisId="sessions"
              type="monotone"
              dataKey="sessions"
              name="세션"
              stroke={C_ACCENT}
              strokeWidth={2}
              fill="url(#gradSessions)"
              dot={false}
              activeDot={{ r: 4, fill: C_ACCENT }}
            />
            <Area
              yAxisId="transactions"
              type="monotone"
              dataKey="transactions"
              name="거래"
              stroke={C_SECOND}
              strokeWidth={2}
              fill="url(#gradTransactions)"
              dot={false}
              activeDot={{ r: 4, fill: C_SECOND }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export function RevenueChart({ data, loading }) {
  if (loading) return <div className="skeleton skeleton-chart" />
  if (!data?.length) return null

  const chartData = data.map(d => ({
    ...d,
    날짜: formatDate(d.date),
  }))

  return (
    <div className="card chart-card fade-in">
      <div className="chart-header">
        <span className="chart-title">일별 수익</span>
        <div className="chart-legend">
          <div className="chart-legend-item">
            <div className="chart-legend-dot" style={{ background: C_ACCENT }} />
            수익
          </div>
        </div>
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C_ACCENT} stopOpacity={0.95} />
                <stop offset="100%" stopColor={C_ACCENT} stopOpacity={0.45} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey="날짜"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${(v/10000).toFixed(0)}만`}
            />
            <Tooltip content={<CustomTooltip type="revenue" />} />
            <Bar
              dataKey="revenue"
              name="수익"
              fill="url(#gradRevenue)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
