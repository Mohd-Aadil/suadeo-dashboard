const readInt = (raw: string | undefined, fallback: number, min: number, max: number) => {
  const value = Number.parseInt(raw ?? '', 10)
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback
}

const env = import.meta.env

export const config = {
  streamUrl: env.VITE_STREAM_URL?.trim() ?? '',
  bufferSize: readInt(env.VITE_BUFFER_SIZE, 10_000, 100, 50_000),
  flushMs: readInt(env.VITE_FLUSH_MS, 250, 50, 2_000),
  clockTickMs: 1_000,
  retryBaseMs: 1_000,
  retryMaxMs: 30_000,
  maxRetries: 8,
  stableAfterMs: 5_000,
} as const

export const TIME_WINDOWS = [
  { label: '30s', value: 30_000 },
  { label: '1m', value: 60_000 },
  { label: '5m', value: 300_000 },
] as const

export const DEFAULT_WINDOW = 60_000
