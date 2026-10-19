import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ConnectionState } from '../types/stream'
import { ConnectionBar } from './ConnectionBar'

const renderBar = (connection: ConnectionState) => {
  const handlers = { onPause: vi.fn(), onResume: vi.fn(), onRetry: vi.fn() }
  render(<ConnectionBar connection={connection} {...handlers} />)
  return handlers
}

describe('ConnectionBar', () => {
  it('shows Live and lets the user pause', () => {
    const { onPause } = renderBar({ status: 'live', attempt: 0 })

    expect(screen.getByText('Live')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))

    expect(onPause).toHaveBeenCalledTimes(1)
  })

  it('shows Resume when paused', () => {
    const { onResume } = renderBar({ status: 'paused', attempt: 0 })

    fireEvent.click(screen.getByRole('button', { name: 'Resume' }))

    expect(onResume).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument()
  })

  it('shows Retry when the connection failed', () => {
    const { onRetry } = renderBar({ status: 'error', attempt: 8 })

    expect(screen.getByText('Offline')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('shows the retry attempt while reconnecting', () => {
    renderBar({ status: 'reconnecting', attempt: 3 })

    expect(screen.getByText('Retry 3 of 8')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
  })
})
