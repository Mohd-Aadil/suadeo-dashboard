import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { LiveFeed } from '../services/liveFeed'
import type { LiveEvent } from '../types/event'
import type { FeedSnapshot } from '../types/stream'
import { Dashboard } from './Dashboard'

// uPlot needs a real canvas, jsdom does not have one
vi.mock('./LiveChart', () => ({ LiveChart: () => <div>chart</div> }))

const NOW = Date.now()

const makeEvent = (id: string, level: LiveEvent['level'], secondsAgo = 1): LiveEvent => ({
  id,
  level,
  timestamp: NOW - secondsAgo * 1000,
  service: 'api',
  latencyMs: 100,
  message: `${level} event`,
})

const fakeFeed = (snapshot: FeedSnapshot) =>
  ({
    subscribeFeed: () => () => {},
    getFeed: () => snapshot,
  }) as unknown as LiveFeed

const renderDashboard = (status: Parameters<typeof Dashboard>[0]['status'], events: LiveEvent[]) =>
  render(<Dashboard feed={fakeFeed({ events, now: NOW })} status={status} windowMs={60_000} />)

describe('Dashboard', () => {
  it('shows a loader while connecting', () => {
    renderDashboard('connecting', [])

    expect(screen.getByRole('status')).toHaveTextContent('Connecting to the stream')
  })

  it('does not show a blank page when live but no events yet', () => {
    renderDashboard('live', [])

    expect(screen.getByText(/waiting for the first events/i)).toBeInTheDocument()
  })

  it('shows an error with no data', () => {
    renderDashboard('error', [])

    expect(screen.getByRole('alert')).toHaveTextContent('Could not reach the stream')
  })

  it('shows kpis for events inside the window only', () => {
    const events = [
      makeEvent('old', 'critical', 120),
      makeEvent('a', 'info'),
      makeEvent('b', 'warning'),
      makeEvent('c', 'warning'),
    ]
    renderDashboard('live', events)

    const stat = (label: string) => within(metrics).getByText(label).parentElement
    const metrics = screen.getByLabelText('Key metrics')
    expect(stat('Total events')).toHaveTextContent('3')
    expect(stat('Warning')).toHaveTextContent('2')
    expect(stat('Critical')).toHaveTextContent('0')
  })

  it('warns that data is stale while reconnecting', () => {
    renderDashboard('reconnecting', [makeEvent('a', 'info')])

    expect(screen.getByText(/connection lost/i)).toBeInTheDocument()
    expect(screen.getByText('chart')).toBeInTheDocument()
  })

  it('shows a paused banner', () => {
    renderDashboard('paused', [makeEvent('a', 'info')])

    expect(screen.getByText(/new events are kept/i)).toBeInTheDocument()
  })
})
