import { useMemo } from 'react'
import { TIME_WINDOWS } from '../config'
import { useFeed } from '../hooks/useLiveStream'
import type { LiveFeed } from '../services/liveFeed'
import type { FeedStatus } from '../types/stream'
import { formatTime } from '../utils/helpers'
import { computeKpis, eventsSince, latencySeries } from '../utils/metrics'
import { EventsList } from './EventsList'
import { KpiCards } from './KpiCards'
import { LiveChart } from './LiveChart'
import { Loading } from './Loading'

interface DashboardProps {
  feed: LiveFeed
  status: FeedStatus
  windowMs: number
}

const EmptyState = ({ status }: { status: FeedStatus }) => {
  switch (status) {
    case 'connecting':
      return <Loading label="Connecting to the stream..." />
    case 'reconnecting':
      return <Loading label="Connection dropped, trying again..." />
    case 'live':
      return <Loading label="Connected, waiting for the first events..." />
    case 'paused':
      return <p className="notice">The feed is paused. Resume to start receiving events.</p>
    case 'error':
      return (
        <p className="notice notice--error" role="alert">
          Could not reach the stream. Use Retry to connect again.
        </p>
      )
  }
}

// the only component subscribed to the fast feed, the sidebar stays out of the hot path
export const Dashboard = ({ feed, status, windowMs }: DashboardProps) => {
  const { events, now } = useFeed(feed)

  const visible = useMemo(() => eventsSince(events, now - windowMs), [events, now, windowMs])
  const kpis = useMemo(() => computeKpis(visible, now), [visible, now])
  const series = useMemo(() => latencySeries(visible), [visible])

  const windowLabel = TIME_WINDOWS.find((option) => option.value === windowMs)?.label
  const lastEvent = events.at(-1)

  return (
    <>
      <header className="content__header">
        <h1>Overview</h1>
        <p>
          Last {windowLabel} · updated {formatTime(now)}
        </p>
      </header>

      {!lastEvent ? (
        <EmptyState status={status} />
      ) : (
        <>
          {(status === 'reconnecting' || status === 'error') && (
            <p className="notice notice--warning" role="status">
              Connection lost. Showing data received until {formatTime(lastEvent.timestamp)}.
            </p>
          )}
          {status === 'paused' && (
            <p className="notice" role="status">
              Paused. New events are kept and will show up when you resume.
            </p>
          )}

          <KpiCards
            total={kpis.total}
            perSecond={kpis.perSecond}
            info={kpis.counts.info}
            warnings={kpis.counts.warning}
            critical={kpis.counts.critical}
          />
          <LiveChart series={series} />
          <EventsList events={visible} />
        </>
      )}
    </>
  )
}
