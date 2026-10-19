import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { LiveEvent } from '../types/event'
import { EventsList } from './EventsList'

const makeEvent = (id: string, message: string, level: LiveEvent['level'] = 'info'): LiveEvent => ({
  id,
  message,
  level,
  timestamp: Date.now(),
  service: 'api',
  latencyMs: 120,
})

const shownMessages = (container: HTMLElement) =>
  [...container.querySelectorAll('.table__message')].map((el) => el.textContent)

describe('EventsList', () => {
  it('shows an empty message when there are no events', () => {
    render(<EventsList events={[]} />)

    expect(screen.getByText('No events match the current filters')).toBeInTheDocument()
  })

  it('shows the newest event first', () => {
    const events = [makeEvent('a', 'first'), makeEvent('b', 'second'), makeEvent('c', 'third')]
    const { container } = render(<EventsList events={events} />)

    expect(shownMessages(container)).toEqual(['third', 'second', 'first'])
    expect(screen.getByText('3 shown')).toBeInTheDocument()
  })

  it('filters by level', () => {
    const events = [
      makeEvent('a', 'all good'),
      makeEvent('b', 'slow', 'warning'),
      makeEvent('c', 'down', 'critical'),
    ]
    const { container } = render(<EventsList events={events} />)

    fireEvent.click(screen.getByLabelText('info'))
    fireEvent.click(screen.getByLabelText('warning'))

    expect(shownMessages(container)).toEqual(['down'])
    expect(screen.getByText('1 shown')).toBeInTheDocument()
  })

  it('renders html from the stream as plain text', () => {
    const payload = '<img src=x onerror="alert(1)">'
    const { container } = render(<EventsList events={[makeEvent('x', payload)]} />)

    expect(screen.getByText(payload)).toBeInTheDocument()
    expect(container.querySelector('img')).toBeNull()
  })
})
