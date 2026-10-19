import { memo, useMemo, useState } from 'react'
import { FixedSizeList, type ListChildComponentProps } from 'react-window'
import { EVENT_LEVELS, type EventLevel, type LiveEvent } from '../types/event'
import { formatNumber, formatTime } from '../utils/helpers'

interface EventsListProps {
  events: readonly LiveEvent[]
}

const ROW_HEIGHT = 40
const LIST_HEIGHT = 400

const ALL_LEVELS: Record<EventLevel, boolean> = { info: true, warning: true, critical: true }

// newest first, without copying the array on every update
const eventAt = (events: readonly LiveEvent[], index: number) => events[events.length - 1 - index]

const Row = ({ index, style, data }: ListChildComponentProps<readonly LiveEvent[]>) => {
  const event = eventAt(data, index)
  if (!event) return null

  return (
    <div className="table__row" style={style}>
      <span className="mono">{formatTime(event.timestamp)}</span>
      <span>
        <span className={`tag tag--${event.level}`}>{event.level}</span>
      </span>
      <span className="table__service">{event.service}</span>
      <span className="table__message" title={event.message}>
        {event.message}
      </span>
      <span className="mono table__num">{event.latencyMs} ms</span>
    </div>
  )
}

const itemKey = (index: number, data: readonly LiveEvent[]) => eventAt(data, index)?.id ?? index

export const EventsList = memo(function EventsList({ events }: EventsListProps) {
  const [levels, setLevels] = useState(ALL_LEVELS)

  const shown = useMemo(() => events.filter((event) => levels[event.level]), [events, levels])

  const toggleLevel = (level: EventLevel) =>
    setLevels((current) => ({ ...current, [level]: !current[level] }))

  return (
    <section className="card">
      <header className="card__header">
        <h2>Events</h2>
        <fieldset className="level-filter">
          <legend className="visually-hidden">Filter by level</legend>
          {EVENT_LEVELS.map((level) => (
            <label key={level}>
              <input
                type="checkbox"
                checked={levels[level]}
                onChange={() => toggleLevel(level)}
              />
              {level}
            </label>
          ))}
        </fieldset>
        <span className="card__meta">{formatNumber(shown.length)} shown</span>
      </header>

      <div className="table">
        <div className="table__row table__head">
          <span>Time</span>
          <span>Level</span>
          <span className="table__service">Service</span>
          <span>Message</span>
          <span className="table__num">Latency</span>
        </div>

        {shown.length === 0 ? (
          <p className="table__empty">No events match the current filters</p>
        ) : (
          <FixedSizeList
            height={Math.min(LIST_HEIGHT, shown.length * ROW_HEIGHT)}
            width="100%"
            itemCount={shown.length}
            itemSize={ROW_HEIGHT}
            itemData={shown}
            itemKey={itemKey}
            overscanCount={5}
          >
            {Row}
          </FixedSizeList>
        )}
      </div>
    </section>
  )
})
