import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Controls } from './Controls'

describe('Controls', () => {
  it('shows the selected window', () => {
    render(<Controls windowMs={60_000} onWindowChange={vi.fn()} />)

    expect(screen.getByLabelText('Time window')).toHaveValue('60000')
  })

  it('calls onWindowChange with the value in ms', () => {
    const onWindowChange = vi.fn()
    render(<Controls windowMs={60_000} onWindowChange={onWindowChange} />)

    fireEvent.change(screen.getByLabelText('Time window'), { target: { value: '300000' } })

    expect(onWindowChange).toHaveBeenCalledWith(300_000)
  })
})
