import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { config } from '../config'
import { openSocket, type SocketLike } from './socket'
import { createStreamClient } from './streamClient'

vi.mock('./socket', () => ({ openSocket: vi.fn() }))

let sockets: SocketLike[] = []

const lastSocket = () => {
  const socket = sockets.at(-1)
  if (!socket) throw new Error('no socket was opened')
  return socket
}

const setup = () => {
  const onStatus = vi.fn()
  const onMessage = vi.fn()
  const client = createStreamClient({ onStatus, onMessage })
  return { client, onStatus, onMessage }
}

describe('streamClient', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    sockets = []
    vi.mocked(openSocket).mockImplementation(() => {
      const socket: SocketLike = { onopen: null, onmessage: null, onclose: null, close: vi.fn() }
      sockets.push(socket)
      return socket
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('goes from connecting to live', () => {
    const { client, onStatus } = setup()

    client.start()
    expect(onStatus).toHaveBeenLastCalledWith('connecting', 0)

    lastSocket().onopen?.()
    expect(onStatus).toHaveBeenLastCalledWith('live', 0)
  })

  it('passes messages through', () => {
    const { client, onMessage } = setup()
    client.start()

    lastSocket().onmessage?.('hello')

    expect(onMessage).toHaveBeenCalledWith('hello')
  })

  it('reconnects after the socket closes', () => {
    const { client, onStatus } = setup()
    client.start()
    lastSocket().onopen?.()

    lastSocket().onclose?.()
    expect(onStatus).toHaveBeenLastCalledWith('reconnecting', 1)
    expect(sockets).toHaveLength(1)

    // jitter makes the exact delay random, the first retry is never more than the base delay
    vi.advanceTimersByTime(config.retryBaseMs)
    expect(sockets).toHaveLength(2)
  })

  it('gives up after max retries', () => {
    const { client, onStatus } = setup()
    client.start()

    for (let i = 0; i < config.maxRetries; i++) {
      lastSocket().onclose?.()
      vi.advanceTimersByTime(config.retryMaxMs)
    }
    lastSocket().onclose?.()

    expect(onStatus).toHaveBeenLastCalledWith('error', config.maxRetries)
    expect(sockets).toHaveLength(config.maxRetries + 1)
  })

  it('resets the attempt counter once the connection is stable', () => {
    const { client, onStatus } = setup()
    client.start()

    lastSocket().onclose?.()
    vi.advanceTimersByTime(config.retryMaxMs)
    lastSocket().onclose?.()
    expect(onStatus).toHaveBeenLastCalledWith('reconnecting', 2)

    vi.advanceTimersByTime(config.retryMaxMs)
    lastSocket().onopen?.()
    vi.advanceTimersByTime(config.stableAfterMs)
    lastSocket().onclose?.()

    expect(onStatus).toHaveBeenLastCalledWith('reconnecting', 1)
  })

  it('does not reconnect after stop', () => {
    const { client, onStatus } = setup()
    client.start()
    const socket = lastSocket()

    client.stop()
    vi.advanceTimersByTime(config.retryMaxMs)

    expect(socket.close).toHaveBeenCalled()
    expect(socket.onclose).toBeNull()
    expect(onStatus).toHaveBeenCalledTimes(1)
  })
})
