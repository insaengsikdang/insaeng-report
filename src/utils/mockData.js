// Mock 데이터 - 실제 GA4 연동 전 UI 개발용
import dayjs from 'dayjs'

// 최근 14일 날짜 생성
const generateDates = (days) => {
  return Array.from({ length: days }, (_, i) =>
    dayjs().subtract(days - 1 - i, 'day').format('YYYY-MM-DD')
  )
}

const dates = generateDates(14)

/** 선택 기간(YYYY-MM-DD)에 맞춘 일별 트렌드 — 날짜 변경 시 UI가 반응하도록 매번 새 배열 생성 */
export function buildMockTrendForRange(startDate, endDate) {
  const start = dayjs(startDate)
  const end = dayjs(endDate)
  if (!start.isValid() || !end.isValid() || end.isBefore(start, 'day')) {
    return []
  }
  const out = []
  for (let d = start; !d.isAfter(end, 'day'); d = d.add(1, 'day')) {
    const i = out.length
    const date = d.format('YYYY-MM-DD')
    const seed = d.date() + (d.month() + 1) * 17
    out.push({
      date,
      sessions: Math.floor(2800 + (seed % 800) + Math.sin(i / 2) * 500),
      transactions: Math.floor(70 + (seed % 50) + Math.sin(i / 2) * 20),
      revenue: Math.floor(2200000 + (seed % 400000) + Math.sin(i / 2) * 300000),
      bounceRate: parseFloat((32 + (seed % 25) + Math.sin(i) * 5).toFixed(1)),
      newUsers: Math.floor(1100 + (seed % 600)),
    })
  }
  return out
}

// 일별 트렌드 데이터
export const mockTrendData = dates.map((date, i) => ({
  date,
  sessions: Math.floor(3000 + Math.random() * 2000 + Math.sin(i / 2) * 500),
  transactions: Math.floor(80 + Math.random() * 60 + Math.sin(i / 2) * 20),
  revenue: Math.floor(2400000 + Math.random() * 1200000 + Math.sin(i / 2) * 300000),
  bounceRate: parseFloat((35 + Math.random() * 20).toFixed(1)),
  newUsers: Math.floor(1200 + Math.random() * 800),
}))

// 오늘 vs 어제 KPI
export const mockKpiData = {
  today: {
    sessions: 4821,
    transactions: 131,
    revenue: 3912000,
    bounceRate: 38.4,
    conversionRate: 2.72,
    newUsers: 1843,
    avgSessionDuration: 185, // 초
    pageviewsPerSession: 3.8,
  },
  yesterday: {
    sessions: 4210,
    transactions: 108,
    revenue: 3241000,
    bounceRate: 42.1,
    conversionRate: 2.57,
    newUsers: 1621,
    avgSessionDuration: 167,
    pageviewsPerSession: 3.4,
  },
}

// 페이지별 성과 데이터 (세션 높고 전환 낮은 페이지 포함)
export const mockPageData = [
  { pagePath: '/products/sneakers-collection', sessions: 1842, transactions: 12, revenue: 1240000, bounceRate: 71.2, conversionRate: 0.65 },
  { pagePath: '/products/running-shoes', sessions: 1521, transactions: 8, revenue: 820000, bounceRate: 68.9, conversionRate: 0.53 },
  { pagePath: '/', sessions: 1203, transactions: 31, revenue: 982000, bounceRate: 32.1, conversionRate: 2.58 },
  { pagePath: '/cart', sessions: 987, transactions: 89, revenue: 2841000, bounceRate: 18.3, conversionRate: 9.02 },
  { pagePath: '/products/accessories', sessions: 876, transactions: 5, revenue: 210000, bounceRate: 74.5, conversionRate: 0.57 },
  { pagePath: '/products', sessions: 764, transactions: 18, revenue: 541000, bounceRate: 45.2, conversionRate: 2.36 },
  { pagePath: '/sale', sessions: 698, transactions: 4, revenue: 185000, bounceRate: 79.3, conversionRate: 0.57 },
  { pagePath: '/checkout', sessions: 621, transactions: 87, revenue: 2710000, bounceRate: 12.1, conversionRate: 14.01 },
  { pagePath: '/about', sessions: 312, transactions: 2, revenue: 62000, bounceRate: 61.4, conversionRate: 0.64 },
  { pagePath: '/blog/sneaker-trends-2025', sessions: 289, transactions: 1, revenue: 41000, bounceRate: 82.1, conversionRate: 0.35 },
]

// 채널별 데이터
export const mockChannelData = [
  { channel: 'Organic Search', sessions: 1821, revenue: 1482000, conversionRate: 2.91 },
  { channel: 'Direct', sessions: 1204, revenue: 1021000, conversionRate: 3.12 },
  { channel: 'Paid Social', sessions: 842, revenue: 621000, conversionRate: 1.84 },
  { channel: 'Email', sessions: 531, revenue: 512000, conversionRate: 4.21 },
  { channel: 'Referral', sessions: 423, revenue: 276000, conversionRate: 2.18 },
]

// 디바이스별 데이터
export const mockDeviceData = [
  { device: 'mobile', sessions: 2891, percentage: 59.97 },
  { device: 'desktop', sessions: 1521, percentage: 31.55 },
  { device: 'tablet', sessions: 409, percentage: 8.48 },
]

// AI 인사이트 (Gemini 응답 Mock)
export const mockInsights = {
  summary: `오늘 **세션 수 4,821건**으로 전일 대비 **+14.5% 증가**했으나, **전환율 2.72%**는 업계 평균인 3.2%에 비해 낮은 수준입니다. 수익은 **₩3,912,000**으로 전일 대비 **+20.7% 성장**했습니다.`,
  highlights: [
    {
      type: 'warning',
      title: '높은 세션, 낮은 전환 페이지 발견',
      description: '/products/sneakers-collection 페이지는 1,842 세션이 유입됐지만 전환율이 0.65%에 불과합니다. 이탈률 71.2%는 페이지 경험 문제를 시사합니다.',
      pages: ['/products/sneakers-collection', '/products/running-shoes', '/products/accessories'],
    },
    {
      type: 'success',
      title: '장바구니-결제 전환 양호',
      description: '장바구니(/cart) → 결제(/checkout) 전환 흐름은 건강합니다. 결제 페이지 전환율 14%는 최적화가 잘 된 상태입니다.',
      pages: ['/cart', '/checkout'],
    },
    {
      type: 'info',
      title: '이메일 채널 ROAS 우수',
      description: '이메일 채널이 세션 수는 적지만 전환율 4.21%로 가장 높습니다. 이메일 캠페인 예산 확대를 검토하세요.',
      pages: [],
    },
  ],
  recommendations: [
    '스니커즈 컬렉션 페이지에 소셜 증명(리뷰, 평점) 추가 및 CTA 버튼 최적화',
    '세일 페이지(/sale) 이탈률 79.3% — 할인 혜택 배너를 더 눈에 띄게 배치',
    '모바일 세션 비중 60% — 모바일 결제 UX 우선 개선 검토',
    '이메일 뉴스레터 발송 빈도 및 타겟 세그먼트 확대 고려',
  ],
  generatedAt: new Date().toISOString(),
}
