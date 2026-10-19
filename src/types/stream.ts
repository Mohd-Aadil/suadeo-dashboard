import type { LiveEvent } from './event'

export type LinkStatus = 'connecting' | 'live' | 'reconnecting' | 'error'

export type FeedStatus = LinkStatus | 'paused'

export interface ConnectionState {
  status: FeedStatus
  attempt: number
}

export interface FeedSnapshot {
  events: readonly LiveEvent[]
  now: number
}
