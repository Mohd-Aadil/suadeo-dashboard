import { memo } from 'react'
import { formatNumber } from '../utils/helpers'

interface KpiCardsProps {
  total: number
  perSecond: number
  info: number
  warnings: number
  critical: number
}

// props are plain numbers so memo can skip the render when nothing changed
export const KpiCards = memo(function KpiCards({
  total,
  perSecond,
  info,
  warnings,
  critical,
}: KpiCardsProps) {
  const stats = [
    { label: 'Total events', value: total, tone: '' },
    { label: 'Events / sec', value: perSecond, tone: '' },
    { label: 'Info', value: info, tone: 'info' },
    { label: 'Warning', value: warnings, tone: 'warning' },
    { label: 'Critical', value: critical, tone: 'critical' },
  ]

  return (
    <dl className="stats" aria-label="Key metrics">
      {stats.map((stat) => (
        <div key={stat.label} className={`stat ${stat.tone && `stat--${stat.tone}`}`}>
          <dt>{stat.label}</dt>
          <dd>{formatNumber(stat.value)}</dd>
        </div>
      ))}
    </dl>
  )
})
