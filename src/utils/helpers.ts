export const appendCapped = <T>(current: readonly T[], incoming: readonly T[], limit: number): T[] => {
  const merged = current.concat(incoming)
  return merged.length > limit ? merged.slice(merged.length - limit) : merged
}

// full jitter so many clients don't reconnect at the same moment
export const backoffDelay = (attempt: number, baseMs: number, maxMs: number) => {
  const ceiling = Math.min(maxMs, baseMs * 2 ** (attempt - 1))
  return Math.round(ceiling / 2 + Math.random() * (ceiling / 2))
}

export const pickRandom = <T>(items: readonly T[]): T => {
  const item = items[Math.floor(Math.random() * items.length)]
  if (item === undefined) throw new Error('pickRandom called with an empty list')
  return item
}

const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

const numberFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 })

export const formatTime = (timestamp: number) => timeFormat.format(timestamp)

export const formatNumber = (value: number) => numberFormat.format(value)
