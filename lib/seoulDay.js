import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

dayjs.extend(utc)
dayjs.extend(timezone)

export const SEOUL_TZ = 'Asia/Seoul'

/**
 * 일간 리포트: 한국 달력 기준 오늘 00:00 ~ 내일 00:00 (KST)
 * 문서 키: YYYY-MM-DD (서울 날짜)
 */
export function getDailyReportWindow(now) {
  const base = now != null ? dayjs(now) : dayjs()
  const d = base.tz(SEOUL_TZ)
  const start = d.startOf('day')
  const end = start.add(1, 'day')
  return {
    key: start.format('YYYY-MM-DD'),
    reportDate: start.format('YYYY-MM-DD'),
    windowStart: start.toISOString(),
    windowEnd: end.toISOString(),
  }
}
