import { describe, expect, it } from 'vitest'
import { appendCapped, backoffDelay } from './helpers'

describe('appendCapped', () => {
  it('keeps only the newest items', () => {
    expect(appendCapped([1, 2, 3], [4, 5], 3)).toEqual([3, 4, 5])
  })

  it('handles a batch bigger than the limit', () => {
    expect(appendCapped([1], [2, 3, 4, 5], 2)).toEqual([4, 5])
  })
})

describe('backoffDelay', () => {
  it('grows with each attempt and stays under the max', () => {
    for (let attempt = 1; attempt <= 10; attempt += 1) {
      const ceiling = Math.min(30_000, 1_000 * 2 ** (attempt - 1))
      const delay = backoffDelay(attempt, 1_000, 30_000)
      expect(delay).toBeGreaterThanOrEqual(ceiling / 2)
      expect(delay).toBeLessThanOrEqual(ceiling)
    }
  })
})
