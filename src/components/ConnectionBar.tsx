import { memo } from 'react'
import { config } from '../config'
import type { ConnectionState, FeedStatus } from '../types/stream'

interface ConnectionBarProps {
  connection: ConnectionState
  onPause: () => void
  onResume: () => void
  onRetry: () => void
}

const LABELS: Record<FeedStatus, string> = {
  connecting: 'Connecting',
  live: 'Live',
  paused: 'Paused',
  reconnecting: 'Reconnecting',
  error: 'Offline',
}

export const ConnectionBar = memo(function ConnectionBar({
  connection,
  onPause,
  onResume,
  onRetry,
}: ConnectionBarProps) {
  const { status, attempt } = connection

  let action = { label: 'Pause', onClick: onPause }
  if (status === 'paused') action = { label: 'Resume', onClick: onResume }
  if (status === 'error') action = { label: 'Retry', onClick: onRetry }

  return (
    <section className="side-section" aria-label="Connection">
      <h2 className="side-section__title">Connection</h2>

      <p className={`status status--${status}`} aria-live="polite">
        <span className="status__dot" aria-hidden="true" />
        {LABELS[status]}
      </p>
      {status === 'reconnecting' && (
        <p className="side-section__note">
          Retry {attempt} of {config.maxRetries}
        </p>
      )}
      {status === 'error' && (
        <p className="side-section__note">Stopped after {config.maxRetries} retries</p>
      )}

      <button
        type="button"
        className={status === 'live' ? 'button' : 'button button--primary'}
        onClick={action.onClick}
      >
        {action.label}
      </button>
    </section>
  )
})
