import { describe, expect, it } from 'vitest'
import type { LiveEvent } from '../types/event'
import { computeKpis, eventsSince, latencySeries } from './metrics'

const event = (timestamp: number, level: LiveEvent['level'], latencyMs = 100): LiveEvent => ({
  id: `evt-${timestamp}`,
  timestamp,
  level,
  latencyMs,
  service: 'api',
  message: 'ok',
})

describe('metrics', () => {
  const events = [event(1_000, 'info', 100), event(1_500, 'warning', 300), event(20_000, 'critical')]

  it('filters by time window', () => {
    expect(eventsSince(events, 1_500)).toHaveLength(2)
  })

  it('counts levels and rate over the last 10s', () => {
    const kpis = computeKpis(events, 20_000)
    expect(kpis.counts).toEqual({ info: 1, warning: 1, critical: 1 })
    expect(kpis.perSecond).toBe(0.1)
  })

  it('averages latency per second', () => {
    expect(latencySeries(events)).toEqual({ times: [1, 20], values: [200, 100] })
  })
})
