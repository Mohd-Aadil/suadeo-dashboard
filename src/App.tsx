import { useState } from 'react'
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary'
import { ConnectionBar } from './components/ConnectionBar'
import { Controls } from './components/Controls'
import { Dashboard } from './components/Dashboard'
import { config, DEFAULT_WINDOW } from './config'
import { useConnection, useLiveStream } from './hooks/useLiveStream'
import { formatNumber } from './utils/helpers'

// no error details on screen, the message could contain stream data
const RenderError = ({ resetErrorBoundary }: FallbackProps) => (
  <div className="notice notice--error" role="alert">
    <p>Something went wrong while drawing the dashboard.</p>
    <button type="button" className="button" onClick={resetErrorBoundary}>
      Try again
    </button>
  </div>
)

const App = () => {
  const feed = useLiveStream()
  const connection = useConnection(feed)
  const [windowMs, setWindowMs] = useState<number>(DEFAULT_WINDOW)

  return (
    <div className="app">
      <aside className="sidebar">
        <p className="sidebar__brand">Service Monitor</p>

        <ConnectionBar
          connection={connection}
          onPause={feed.pause}
          onResume={feed.resume}
          onRetry={feed.retry}
        />
        <Controls windowMs={windowMs} onWindowChange={setWindowMs} />

        <dl className="sidebar__info">
          <div>
            <dt>Buffer</dt>
            <dd>{formatNumber(config.bufferSize)} events</dd>
          </div>
          <div>
            <dt>UI refresh</dt>
            <dd>{config.flushMs} ms</dd>
          </div>
        </dl>
      </aside>

      <main className="content">
        <ErrorBoundary FallbackComponent={RenderError}>
          <Dashboard feed={feed} status={connection.status} windowMs={windowMs} />
        </ErrorBoundary>
      </main>
    </div>
  )
}

export default App
