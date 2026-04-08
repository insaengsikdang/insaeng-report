import { formatCurrency, formatPercent } from '../../utils/formatters'

const CHANNEL_COLORS = [
  '#ff6200', '#ea580c', '#64748b', '#0f766e', '#334155',
]

export default function ChannelCard({ data, loading }) {
  if (loading) return <div className="skeleton skeleton-chart" />
  if (!data?.length) return null

  const maxRevenue = Math.max(...data.map(d => d.revenue))

  return (
    <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="card-header">
        <span className="card-title">채널별 수익</span>
      </div>
      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="channel-list">
          {data.map((item, i) => (
            <div key={item.channel} className="channel-item">
              <div className="channel-item-header">
                <span className="channel-name">{item.channel}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontSize: '0.72rem',
                    color: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
                    fontWeight: 600
                  }}>
                    {formatPercent(item.conversionRate)} CVR
                  </span>
                  <span className="channel-revenue">{formatCurrency(item.revenue)}</span>
                </div>
              </div>
              <div className="channel-bar-track">
                <div
                  className="channel-bar-fill"
                  style={{
                    width: `${(item.revenue / maxRevenue) * 100}%`,
                    background: CHANNEL_COLORS[i % CHANNEL_COLORS.length],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
