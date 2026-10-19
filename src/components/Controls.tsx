import { memo } from 'react'
import { TIME_WINDOWS } from '../config'

interface ControlsProps {
  windowMs: number
  onWindowChange: (windowMs: number) => void
}

export const Controls = memo(function Controls({ windowMs, onWindowChange }: ControlsProps) {
  return (
    <section className="side-section">
      <label className="side-section__title" htmlFor="time-window">
        Time window
      </label>
      <select
        id="time-window"
        className="select"
        value={windowMs}
        onChange={(e) => onWindowChange(Number(e.target.value))}
      >
        {TIME_WINDOWS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </section>
  )
})
