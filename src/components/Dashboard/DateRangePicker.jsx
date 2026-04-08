import { useRef } from 'react'
import { Calendar } from 'lucide-react'

function openPicker(input) {
  if (!input) return
  if (typeof input.showPicker === 'function') {
    input.showPicker().catch(() => input.focus())
  } else {
    input.focus()
    input.click()
  }
}

export default function DateRangePicker({ startDate, endDate, onChange }) {
  const startRef = useRef(null)
  const endRef = useRef(null)

  return (
    <div className="date-picker-wrapper" id="date-range-picker">
      <button
        type="button"
        className="date-picker-icon-btn"
        aria-label="시작일 달력 열기"
        onClick={() => openPicker(startRef.current)}
      >
        <Calendar size={14} aria-hidden />
      </button>
      <input
        ref={startRef}
        type="date"
        className="date-input"
        value={startDate}
        max={endDate}
        onChange={(e) => onChange({ startDate: e.target.value, endDate })}
        id="start-date-input"
        aria-label="시작일"
      />
      <span style={{ color: 'var(--text-muted)' }}>~</span>
      <input
        ref={endRef}
        type="date"
        className="date-input"
        value={endDate}
        min={startDate}
        onChange={(e) => onChange({ startDate, endDate: e.target.value })}
        id="end-date-input"
        aria-label="종료일"
      />
      <button
        type="button"
        className="date-picker-icon-btn"
        aria-label="종료일 달력 열기"
        onClick={() => openPicker(endRef.current)}
      >
        <Calendar size={14} aria-hidden />
      </button>
    </div>
  )
}
