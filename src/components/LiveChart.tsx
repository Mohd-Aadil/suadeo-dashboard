import { memo, useEffect, useRef } from 'react'
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import { formatTime } from '../utils/helpers'
import type { LatencySeries } from '../utils/metrics'

interface LiveChartProps {
  series: LatencySeries
}

const HEIGHT = 280
const AXIS_COLOR = '#6b7280'
const GRID_COLOR = '#eceef1'

const axis: uPlot.Axis = {
  stroke: AXIS_COLOR,
  grid: { stroke: GRID_COLOR, width: 1 },
  ticks: { stroke: GRID_COLOR, width: 1 },
}

const buildOptions = (width: number): uPlot.Options => ({
  width,
  height: HEIGHT,
  legend: { show: false },
  cursor: { drag: { x: false, y: false } },
  scales: { y: { range: (_plot, _min, max) => [0, Math.max(200, Math.ceil(max * 1.15))] } },
  series: [
    {},
    { label: 'Avg latency', stroke: '#2f6fde', width: 1.5, fill: 'rgba(47, 111, 222, 0.08)' },
  ],
  axes: [
    {
      ...axis,
      space: 90,
      incrs: [1, 5, 10, 15, 30, 60],
      values: (_plot, ticks) => ticks.map((tick) => formatTime(tick * 1000)),
    },
    { ...axis, size: 64, values: (_plot, ticks) => ticks.map((tick) => `${tick} ms`) },
  ],
})

// uPlot is driven imperatively, new data goes through setData instead of a React re-render
export const LiveChart = memo(function LiveChart({ series }: LiveChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const plotRef = useRef<uPlot | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const plot = new uPlot(buildOptions(container.clientWidth), [[], []], container)
    const observer = new ResizeObserver(([entry]) => {
      if (entry) plot.setSize({ width: entry.contentRect.width, height: HEIGHT })
    })
    observer.observe(container)
    plotRef.current = plot

    return () => {
      observer.disconnect()
      plot.destroy()
      plotRef.current = null
    }
  }, [])

  useEffect(() => {
    plotRef.current?.setData([series.times, series.values])
  }, [series])

  return (
    <section className="card">
      <header className="card__header">
        <h2>Latency</h2>
        <span className="card__meta">avg per second</span>
      </header>
      <div className="chart">
        <div ref={containerRef} />
        {series.times.length === 0 && <p className="chart__empty">No data in this window</p>}
      </div>
    </section>
  )
})
