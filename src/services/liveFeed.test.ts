import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { config } from '../config'
import { createLiveFeed } from './liveFeed'
import { createStreamClient } from './streamClient'

vi.mock('./streamClient', () => ({
  createStreamClient: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
}))

let counter = 0

const message = (level = 'info') => {
  counter++
  return JSON.stringify({
    id: `evt-${counter}`,
    timestamp: Date.now(),
    service: 'api',
    level,
    latencyMs: 100,
    message: 'ok',
  })
}

// grab the callbacks liveFeed handed to the (mocked) stream client
const getHandlers = () => {
  const handlers = vi.mocked(createStreamClient).mock.calls.at(-1)?.[0]
  if (!handlers) throw new Error('stream client was not created')
  return handlers
}

const setup = () => {
  const feed = createLiveFeed()
  const listener = vi.fn()
  feed.subscribeFeed(listener)
  feed.start()
  return { feed, listener, ...getHandlers() }
}

describe('liveFeed', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('batches messages into one update per flush', () => {
    const { feed, listener, onMessage } = setup()

    onMessage(message())
    onMessage(message())
    onMessage(message())
    expect(feed.getFeed().events).toHaveLength(0)

    vi.advanceTimersByTime(config.flushMs)

    expect(feed.getFeed().events).toHaveLength(3)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('drops invalid messages', () => {
    const { feed, onMessage } = setup()

    onMessage('not json')
    onMessage(message('panic'))
    onMessage(message())
    vi.advanceTimersByTime(config.flushMs)

    expect(feed.getFeed().events).toHaveLength(1)
  })

  it('keeps the clock moving when no data comes in', () => {
    const { feed, listener } = setup()
    const before = feed.getFeed().now

    vi.advanceTimersByTime(config.clockTickMs + config.flushMs)

    expect(listener).toHaveBeenCalled()
    expect(feed.getFeed().now).toBeGreaterThan(before)
  })

  it('holds events while paused and shows them on resume', () => {
    const { feed, onMessage } = setup()

    feed.pause()
    onMessage(message())
    onMessage(message())
    vi.advanceTimersByTime(config.clockTickMs * 3)
    expect(feed.getFeed().events).toHaveLength(0)

    feed.resume()
    expect(feed.getFeed().events).toHaveLength(2)
  })

  it('reports paused status and restores the real one on resume', () => {
    const { feed, onStatus } = setup()
    onStatus('live', 0)

    feed.pause()
    expect(feed.getConnection().status).toBe('paused')

    onStatus('reconnecting', 1)
    expect(feed.getConnection().status).toBe('paused')

    feed.resume()
    expect(feed.getConnection()).toEqual({ status: 'reconnecting', attempt: 1 })
  })

  it('never keeps more than the buffer size', () => {
    const { feed, onMessage } = setup()

    for (let i = 0; i < config.bufferSize + 500; i++) onMessage(message())
    vi.advanceTimersByTime(config.flushMs)

    const { events } = feed.getFeed()
    expect(events).toHaveLength(config.bufferSize)
    expect(events.at(-1)?.id).toBe(`evt-${counter}`)
  })

  it('stops flushing after stop', () => {
    const { feed, listener, onMessage } = setup()

    feed.stop()
    onMessage(message())
    vi.advanceTimersByTime(config.clockTickMs * 2)

    expect(listener).not.toHaveBeenCalled()
  })
})
