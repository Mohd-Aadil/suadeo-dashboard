import { EVENT_LEVELS, type EventLevel, type LiveEvent } from '../types/event'

const MAX_PAYLOAD_LENGTH = 2_048
const MAX_MESSAGE_LENGTH = 200
const MAX_SERVICE_LENGTH = 40
const MAX_LATENCY_MS = 60_000
const MAX_CLOCK_SKEW_MS = 5 * 60_000
const ID_PATTERN = /^[\w-]{1,64}$/
const CONTROL_CHARS = /\p{Cc}/gu

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isLevel = (value: unknown): value is EventLevel =>
  EVENT_LEVELS.some((level) => level === value)

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const cleanText = (value: unknown, maxLength: number) => {
  if (typeof value !== 'string') return null
  const text = value.replace(CONTROL_CHARS, ' ').trim().slice(0, maxLength)
  return text.length > 0 ? text : null
}

const safeJsonParse = (raw: string): unknown => {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * Turns a raw socket message into a LiveEvent, or null when anything is off.
 * Text is kept as plain text, React escapes it when rendering.
 */
export const parseEvent = (raw: unknown, now = Date.now()): LiveEvent | null => {
  if (typeof raw !== 'string' || raw.length > MAX_PAYLOAD_LENGTH) return null

  const data = safeJsonParse(raw)
  if (!isRecord(data)) return null

  const { id, timestamp, service, level, latencyMs, message } = data

  if (typeof id !== 'string' || !ID_PATTERN.test(id)) return null
  if (!isFiniteNumber(timestamp) || Math.abs(now - timestamp) > MAX_CLOCK_SKEW_MS) return null
  if (!isFiniteNumber(latencyMs) || latencyMs < 0 || latencyMs > MAX_LATENCY_MS) return null
  if (!isLevel(level)) return null

  const safeService = cleanText(service, MAX_SERVICE_LENGTH)
  const safeMessage = cleanText(message, MAX_MESSAGE_LENGTH)
  if (!safeService || !safeMessage) return null

  return {
    id,
    timestamp,
    level,
    latencyMs: Math.round(latencyMs),
    service: safeService,
    message: safeMessage,
  }
}
