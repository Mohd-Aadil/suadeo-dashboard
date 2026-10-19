import { describe, expect, it } from 'vitest'
import { parseEvent } from './validate'

const NOW = 1_700_000_000_000

const payload = (overrides: Record<string, unknown> = {}) =>
  JSON.stringify({
    id: 'evt-1',
    timestamp: NOW,
    service: 'api',
    level: 'info',
    latencyMs: 120.4,
    message: 'Request completed',
    ...overrides,
  })

describe('parseEvent', () => {
  it('accepts a valid event', () => {
    expect(parseEvent(payload(), NOW)).toEqual({
      id: 'evt-1',
      timestamp: NOW,
      service: 'api',
      level: 'info',
      latencyMs: 120,
      message: 'Request completed',
    })
  })

  it.each([
    ['broken json', '{"id":'],
    ['non string payload', { id: 'evt-1' }],
    ['array', '[]'],
    ['unknown level', payload({ level: 'panic' })],
    ['negative latency', payload({ latencyMs: -1 })],
    ['string timestamp', payload({ timestamp: 'yesterday' })],
    ['old timestamp', payload({ timestamp: NOW - 60 * 60_000 })],
    ['html in id', payload({ id: '<b>x</b>' })],
    ['empty message', payload({ message: '   ' })],
    ['oversized payload', payload({ message: 'x'.repeat(5_000) })],
  ])('rejects %s', (_name, raw) => {
    expect(parseEvent(raw, NOW)).toBeNull()
  })

  it('keeps markup as plain text and strips control chars', () => {
    const event = parseEvent(payload({ message: '<img src=x onerror=alert(1)>\u0007' }), NOW)
    expect(event?.message).toBe('<img src=x onerror=alert(1)>')
  })
})
