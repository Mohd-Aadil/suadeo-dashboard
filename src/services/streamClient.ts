import { config } from '../config'
import type { LinkStatus } from '../types/stream'
import { backoffDelay } from '../utils/helpers'
import { openSocket, type SocketLike } from './socket'

interface StreamClientHandlers {
  onMessage: (data: unknown) => void
  onStatus: (status: LinkStatus, attempt: number) => void
}

interface StreamClient {
  start: () => void
  stop: () => void
}

export const createStreamClient = ({ onMessage, onStatus }: StreamClientHandlers): StreamClient => {
  let socket: SocketLike | null = null
  let retryTimer: ReturnType<typeof setTimeout> | undefined
  let stableTimer: ReturnType<typeof setTimeout> | undefined
  let attempt = 0

  const stop = () => {
    clearTimeout(retryTimer)
    clearTimeout(stableTimer)
    if (!socket) return
    socket.onopen = null
    socket.onmessage = null
    socket.onclose = null
    socket.close()
    socket = null
  }

  const scheduleRetry = () => {
    if (attempt >= config.maxRetries) {
      onStatus('error', attempt)
      return
    }
    attempt += 1
    onStatus('reconnecting', attempt)
    retryTimer = setTimeout(connect, backoffDelay(attempt, config.retryBaseMs, config.retryMaxMs))
  }

  const connect = () => {
    stop()
    const next = openSocket(config.streamUrl)

    next.onopen = () => {
      onStatus('live', attempt)
      // reset the backoff only when the link stays up, so a flapping server is not hammered
      stableTimer = setTimeout(() => {
        attempt = 0
      }, config.stableAfterMs)
    }
    next.onmessage = onMessage
    next.onclose = () => {
      socket = null
      clearTimeout(stableTimer)
      scheduleRetry()
    }

    socket = next
  }

  const start = () => {
    attempt = 0
    onStatus('connecting', 0)
    connect()
  }

  return { start, stop }
}
