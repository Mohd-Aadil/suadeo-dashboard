import { config } from '../config'
import type { LiveEvent } from '../types/event'
import type { ConnectionState, FeedSnapshot } from '../types/stream'
import { appendCapped } from '../utils/helpers'
import { parseEvent } from '../utils/validate'
import { createStreamClient } from './streamClient'

type Listener = () => void

export interface LiveFeed {
  start: () => void
  stop: () => void
  pause: () => void
  resume: () => void
  retry: () => void
  subscribeFeed: (listener: Listener) => () => void
  getFeed: () => FeedSnapshot
  subscribeConnection: (listener: Listener) => () => void
  getConnection: () => ConnectionState
}

/**
 * Sits between the socket and React. Messages are validated and queued,
 * then published as one batch every `flushMs` so the UI never renders per message.
 */
export const createLiveFeed = (): LiveFeed => {
  const feedListeners = new Set<Listener>()
  const connectionListeners = new Set<Listener>()

  let pending: LiveEvent[] = []
  let feed: FeedSnapshot = { events: [], now: Date.now() }
  let link: ConnectionState = { status: 'connecting', attempt: 0 }
  let connection = link
  let paused = false
  let flushTimer: ReturnType<typeof setInterval> | undefined

  const notify = (listeners: Set<Listener>) => listeners.forEach((listener) => listener())

  const subscribe = (listeners: Set<Listener>) => (listener: Listener) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  const publishConnection = () => {
    connection = paused ? { status: 'paused', attempt: link.attempt } : link
    notify(connectionListeners)
  }

  const flush = () => {
    if (paused) return

    const now = Date.now()
    // even without new data the clock has to move, otherwise the time window stops sliding
    if (pending.length === 0 && now - feed.now < config.clockTickMs) return

    const events =
      pending.length > 0 ? appendCapped(feed.events, pending, config.bufferSize) : feed.events
    pending = []
    feed = { events, now }
    notify(feedListeners)
  }

  const client = createStreamClient({
    onMessage: (data) => {
      const event = parseEvent(data)
      if (!event) return
      pending.push(event)
      // backpressure: trim in chunks so a flood does not cost one array copy per message
      if (pending.length >= config.bufferSize * 2) pending = pending.slice(-config.bufferSize)
    },
    onStatus: (status, attempt) => {
      link = { status, attempt }
      publishConnection()
    },
  })

  return {
    start: () => {
      client.start()
      clearInterval(flushTimer)
      flushTimer = setInterval(flush, config.flushMs)
    },
    stop: () => {
      clearInterval(flushTimer)
      client.stop()
    },
    // socket stays open while paused, events keep queuing (bounded) and appear on resume
    pause: () => {
      paused = true
      publishConnection()
    },
    resume: () => {
      paused = false
      publishConnection()
      flush()
    },
    retry: () => client.start(),
    subscribeFeed: subscribe(feedListeners),
    getFeed: () => feed,
    subscribeConnection: subscribe(connectionListeners),
    getConnection: () => connection,
  }
}
