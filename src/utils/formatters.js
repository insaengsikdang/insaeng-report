/**
 * 숫자/날짜 포맷터 유틸리티
 */

// 원화 포맷 (₩1,234,000)
export const formatCurrency = (value) => {
  if (value === null || value === undefined) return '-'
  return `₩${Math.round(value).toLocaleString('ko-KR')}`
}

// 퍼센트 포맷 (2.72%)
export const formatPercent = (value, decimals = 2) => {
  if (value === null || value === undefined) return '-'
  return `${parseFloat(value).toFixed(decimals)}%`
}

// 숫자 포맷 (4,821)
export const formatNumber = (value) => {
  if (value === null || value === undefined) return '-'
  return Math.round(value).toLocaleString('ko-KR')
}

// 증감률 포맷 (+14.5%)
export const formatChange = (current, previous) => {
  if (!previous || previous === 0) return { value: '0%', positive: true }
  const change = ((current - previous) / previous) * 100
  const formatted = `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
  return { value: formatted, positive: change >= 0 }
}

// 초 → 분:초 포맷 (185 → 3분 5초)
export const formatDuration = (seconds) => {
  if (!seconds) return '-'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}초`
  return `${m}분 ${s}초`
}

// 날짜 포맷 (2025-01-08 → 1/8)
export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 날짜 한국어 포맷 (2025-01-08 → 2025년 1월 8일)
export const formatDateKo = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
}

// 큰 숫자 축약 (1200000 → 120만)
export const formatCompact = (value) => {
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억`
  if (value >= 10000) return `${(value / 10000).toFixed(0)}만`
  return formatNumber(value)
}
