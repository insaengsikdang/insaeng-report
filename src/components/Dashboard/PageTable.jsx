import { useState } from 'react'
import { ChevronUp, ChevronDown, AlertTriangle, CheckCircle, Minus } from 'lucide-react'
import { formatNumber, formatCurrency, formatPercent } from '../../utils/formatters'

const SORT_FIELDS = ['sessions', 'transactions', 'revenue', 'bounceRate', 'conversionRate']

// 전환율이 1% 미만이고 세션이 500 이상이면 "주의" 하이라이트
const isLowConversion = (row) => row.sessions >= 500 && row.conversionRate < 1.0

export default function PageTable({ data, loading }) {
  const [sortField, setSortField] = useState('sessions')
  const [sortDir, setSortDir] = useState('desc')

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  if (loading) {
    return (
      <div className="card table-section fade-in">
        <div className="card-header">
          <span className="card-title">페이지별 성과</span>
        </div>
        <div className="card-body">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton skeleton-text" style={{ marginBottom: 12, height: 18 }} />
          ))}
        </div>
      </div>
    )
  }

  if (!data?.length) return null

  const sorted = [...data].sort((a, b) => {
    const mul = sortDir === 'desc' ? -1 : 1
    return (a[sortField] - b[sortField]) * mul
  })

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <Minus size={11} style={{ opacity: 0.3 }} />
    return sortDir === 'desc' ? <ChevronDown size={13} /> : <ChevronUp size={13} />
  }

  return (
    <div className="card table-section fade-in">
      <div className="card-header" style={{ marginBottom: 0 }}>
        <span className="card-title">페이지별 성과</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
            <AlertTriangle size={11} />
            세션↑ 전환↓ 주의
          </div>
        </div>
      </div>
      <div className="table-container" style={{ padding: '8px 0 0' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: 24 }}>페이지 경로</th>
              {[
                { key: 'sessions', label: '세션' },
                { key: 'transactions', label: '거래' },
                { key: 'revenue', label: '수익' },
                { key: 'bounceRate', label: '이탈률' },
                { key: 'conversionRate', label: '전환율' },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  className={`text-right ${sortField === key ? 'active' : ''}`}
                  onClick={() => handleSort(key)}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {label} <SortIcon field={key} />
                  </span>
                </th>
              ))}
              <th className="text-center">상태</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => {
              const warn = isLowConversion(row)
              return (
                <tr key={row.pagePath} style={warn ? { background: 'rgba(217, 119, 6, 0.06)' } : {}}>
                  <td style={{ paddingLeft: 24 }}>
                    <span className="page-path" title={row.pagePath}>
                      {row.pagePath}
                    </span>
                  </td>
                  <td className="text-right" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    {formatNumber(row.sessions)}
                  </td>
                  <td className="text-right" style={{ color: 'var(--text-secondary)' }}>
                    {formatNumber(row.transactions)}
                  </td>
                  <td className="text-right" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {formatCurrency(row.revenue)}
                  </td>
                  <td className="text-right">
                    <span className={`badge ${row.bounceRate > 70 ? 'badge-danger' : row.bounceRate > 50 ? 'badge-warning' : 'badge-success'}`}>
                      {formatPercent(row.bounceRate)}
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={`badge ${row.conversionRate < 1 ? 'badge-danger' : row.conversionRate < 2.5 ? 'badge-warning' : 'badge-success'}`}>
                      {formatPercent(row.conversionRate)}
                    </span>
                  </td>
                  <td className="text-center">
                    {warn
                      ? <AlertTriangle size={15} color="var(--warning)" title="세션 많고 전환 낮음" />
                      : <CheckCircle size={15} color="var(--success)" title="정상" />
                    }
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
