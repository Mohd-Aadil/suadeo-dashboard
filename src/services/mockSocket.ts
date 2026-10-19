import type { EventLevel } from '../types/event'
import { pickRandom } from '../utils/helpers'
import type { SocketLike } from './socket'

const TICK_MS = 100
const BURST_CHANCE = 0.005
const BURST_SIZE = 500
const MALFORMED_CHANCE = 0.02
const UNSAFE_TEXT_CHANCE = 0.01
const CONNECT_FAIL_CHANCE = 0.1

const SERVICES = ['gateway', 'auth', 'orders', 'inventory', 'payments', 'notifications']

const MESSAGES: Record<EventLevel, string[]> = {
  info: ['Request served', 'Health check ok', 'Cache warmed', 'Session created', 'Job completed'],
  warning: ['Slow response', 'Retrying downstream call', 'Queue is growing', 'High memory usage'],
  critical: ['Downstream timeout', 'DB pool exhausted', 'Error rate over threshold'],
}

const LATENCY_RANGE: Record<EventLevel, [number, number]> = {
  info: [30, 180],
  warning: [250, 600],
  critical: [700, 1_500],
}

// used to prove that bad input never reaches the UI
const UNSAFE_MESSAGES = ['<img src=x onerror="alert(1)">', '<script>alert(document.cookie)</script>']
const MALFORMED = ['{"id":"evt-', 'null', '[]', '{"id":"x","level":"fatal"}', '{"timestamp":"now"}']

let sequence = 0

const randomLevel = (): EventLevel => {
  const roll = Math.random()
  if (roll > 0.97) return 'critical'
  if (roll > 0.85) return 'warning'
  return 'info'
}

const createPayload = () => {
  if (Math.random() < MALFORMED_CHANCE) return pickRandom(MALFORMED)

  sequence += 1
  const level = randomLevel()
  const [min, max] = LATENCY_RANGE[level]
  const unsafe = Math.random() < UNSAFE_TEXT_CHANCE

  return JSON.stringify({
    id: `evt-${sequence}`,
    timestamp: Date.now(),
    service: pickRandom(SERVICES),
    level,
    latencyMs: min + Math.random() * (max - min),
    message: unsafe ? pickRandom(UNSAFE_MESSAGES) : pickRandom(MESSAGES[level]),
  })
}

export const createMockSocket = (): SocketLike => {
  let closed = false
  let tickTimer: ReturnType<typeof setInterval> | undefined
  let dropTimer: ReturnType<typeof setTimeout> | undefined

  const stop = () => {
    closed = true
    clearTimeout(connectTimer)
    clearInterval(tickTimer)
    clearTimeout(dropTimer)
  }

  const socket: SocketLike = { onopen: null, onmessage: null, onclose: null, close: stop }

  const drop = () => {
    if (closed) return
    stop()
    socket.onclose?.()
  }

  const tick = () => {
    const count = Math.random() < BURST_CHANCE ? BURST_SIZE : Math.floor(Math.random() * 3)
    for (let i = 0; i < count && !closed; i += 1) socket.onmessage?.(createPayload())
  }

  const connectTimer = setTimeout(
    () => {
      if (Math.random() < CONNECT_FAIL_CHANCE) return drop()
      socket.onopen?.()
      tickTimer = setInterval(tick, TICK_MS)
      dropTimer = setTimeout(drop, 30_000 + Math.random() * 60_000)
    },
    300 + Math.random() * 700,
  )

  return socket
}
