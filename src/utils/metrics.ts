import type { EventLevel, LiveEvent } from '../types/event'

const RATE_WINDOW_MS = 10_000

interface Kpis {
  total: number
  perSecond: number
  counts: Record<EventLevel, number>
}

export interface LatencySeries {
  times: number[]
  values: number[]
}

export const eventsSince = (events: readonly LiveEvent[], since: number) =>
  events.filter((event) => event.timestamp >= since)

export const computeKpis = (events: readonly LiveEvent[], now: number): Kpis => {
  const counts: Record<EventLevel, number> = { info: 0, warning: 0, critical: 0 }
  let recent = 0

  for (const event of events) {
    counts[event.level] += 1
    if (event.timestamp >= now - RATE_WINDOW_MS) recent += 1
  }

  return { total: events.length, perSecond: recent / (RATE_WINDOW_MS / 1000), counts }
}

// average latency per second, times are in seconds because that's what uPlot expects
export const latencySeries = (events: readonly LiveEvent[]): LatencySeries => {
  const buckets = new Map<number, { sum: number; count: number }>()

  for (const event of events) {
    const second = Math.floor(event.timestamp / 1000)
    const bucket = buckets.get(second)
    if (bucket) {
      bucket.sum += event.latencyMs
      bucket.count += 1
    } else {
      buckets.set(second, { sum: event.latencyMs, count: 1 })
    }
  }

  const times = [...buckets.keys()].sort((a, b) => a - b)
  const values = times.map((time) => {
    const bucket = buckets.get(time)
    return bucket ? Math.round(bucket.sum / bucket.count) : 0
  })

  return { times, values }
}
