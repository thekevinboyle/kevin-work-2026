import { useState, useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3'
import { usePlausible } from './hooks/usePlausible'
import './dashboard.css'

function PasswordGate({ onUnlock }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (value === import.meta.env.VITE_DASHBOARD_PASSWORD) {
      sessionStorage.setItem('dashboard-auth', '1')
      onUnlock()
    } else {
      setError(true)
      setValue('')
    }
  }

  return (
    <div className="dash-gate">
      <form className="dash-gate__form" onSubmit={handleSubmit}>
        <label className="dash-gate__label">DASHBOARD // ACCESS</label>
        <input
          className="dash-gate__input"
          type="password"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(false); }}
          placeholder="ENTER PASSWORD"
          autoFocus
        />
        {error && <span className="dash-gate__error">INVALID CREDENTIALS</span>}
      </form>
    </div>
  )
}

/* ========== Utility functions ========== */

function formatDuration(seconds) {
  if (seconds == null) return '—'
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}m ${s}s`
}

function formatNumber(n) {
  if (n == null) return '—'
  return n.toLocaleString()
}

function formatDelta(change) {
  if (change == null) return null
  const sign = change > 0 ? '+' : ''
  return `${sign}${change}%`
}

/* ========== Rolling Counter Hook ========== */

function useAnimatedValue(target, duration = 400) {
  const [display, setDisplay] = useState(target ?? 0)
  const rafRef = useRef(null)
  const startRef = useRef(null)
  const fromRef = useRef(display)

  useEffect(() => {
    if (target == null) return
    const from = fromRef.current
    const to = target
    if (from === to) return

    startRef.current = performance.now()

    function tick(now) {
      const elapsed = now - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = from + (to - from) * eased
      setDisplay(current)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = to
      }
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  // Update fromRef when animation completes or target changes
  useEffect(() => {
    return () => { fromRef.current = display }
  })

  return display
}

/* ========== KPI Card Component ========== */

function KpiCard({ label, value, change, format = 'number' }) {
  const numericValue = typeof value === 'number' ? value : 0
  const animated = useAnimatedValue(numericValue)

  let displayValue
  if (value == null) {
    displayValue = '—'
  } else if (format === 'percent') {
    displayValue = `${Math.round(animated)}%`
  } else if (format === 'duration') {
    displayValue = formatDuration(animated)
  } else if (format === 'decimal') {
    displayValue = animated.toFixed(1)
  } else {
    displayValue = formatNumber(Math.round(animated))
  }

  const deltaText = formatDelta(change)
  const deltaClass = change > 0
    ? 'dash__kpi-delta dash__kpi-delta--up'
    : change < 0
      ? 'dash__kpi-delta dash__kpi-delta--down'
      : 'dash__kpi-delta'

  return (
    <div className="dash__kpi">
      <div className="dash__kpi-label">{label}</div>
      <div className="dash__kpi-value">{displayValue}</div>
      {deltaText && <div className={deltaClass}>{deltaText}</div>}
    </div>
  )
}

/* ========== Breakdown Panel Component ========== */

function BreakdownPanel({ title, data, nameKey, valueKey }) {
  const [mounted, setMounted] = useState(false)
  const rows = data ? data.slice(0, 10) : []
  const maxVal = rows.length > 0 ? Math.max(...rows.map(r => r[valueKey] || 0)) : 1

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [data])

  return (
    <div className="dash__panel">
      <div className="dash__panel-title">{title}</div>
      {rows.map((row, i) => {
        const pct = maxVal > 0 ? ((row[valueKey] || 0) / maxVal) * 100 : 0
        return (
          <div className="dash__panel-row" key={row[nameKey] || i}>
            <div
              className="dash__panel-row-bar"
              style={{ width: mounted ? `${pct}%` : '0%', transitionDelay: `${i * 50}ms` }}
            />
            <span className="dash__panel-row-name">{row[nameKey] || '(none)'}</span>
            <span className="dash__panel-row-value">{formatNumber(row[valueKey])}</span>
          </div>
        )
      })}
      {rows.length === 0 && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>No data</div>
      )}
    </div>
  )
}

/* ========== Devices Panel with Tabs ========== */

function DevicesPanel({ devices, browsers, os }) {
  const [tab, setTab] = useState('device')

  const tabs = [
    { key: 'device', label: 'DEVICE' },
    { key: 'browser', label: 'BROWSER' },
    { key: 'os', label: 'OS' },
  ]

  const dataMap = { device: devices, browser: browsers, os: os }
  const activeData = dataMap[tab] || []

  return (
    <div className="dash__panel">
      <div className="dash__device-tabs">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`dash__device-tab${tab === t.key ? ' dash__device-tab--active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <BreakdownRows data={activeData} nameKey={tab} valueKey="visitors" />
    </div>
  )
}

function BreakdownRows({ data, nameKey, valueKey }) {
  const [mounted, setMounted] = useState(false)
  const rows = data ? data.slice(0, 10) : []
  const maxVal = rows.length > 0 ? Math.max(...rows.map(r => r[valueKey] || 0)) : 1

  useEffect(() => {
    setMounted(false)
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [data])

  return (
    <>
      {rows.map((row, i) => {
        const pct = maxVal > 0 ? ((row[valueKey] || 0) / maxVal) * 100 : 0
        return (
          <div className="dash__panel-row" key={row[nameKey] || i}>
            <div
              className="dash__panel-row-bar"
              style={{ width: mounted ? `${pct}%` : '0%', transitionDelay: `${i * 50}ms` }}
            />
            <span className="dash__panel-row-name">{row[nameKey] || '(none)'}</span>
            <span className="dash__panel-row-value">{formatNumber(row[valueKey])}</span>
          </div>
        )
      })}
      {rows.length === 0 && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>No data</div>
      )}
    </>
  )
}

/* ========== D3 Timeseries Chart ========== */

function TimeseriesChart({ timeseries }) {
  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const tooltipRef = useRef(null)
  const drawnRef = useRef(false)

  const CHART_HEIGHT = 280
  const MARGIN = { top: 16, right: 16, bottom: 28, left: 44 }

  const drawChart = useCallback(() => {
    if (!containerRef.current || !timeseries || timeseries.length === 0) return

    const container = containerRef.current
    const width = container.clientWidth
    const svg = d3.select(svgRef.current)
    const tooltip = tooltipRef.current

    // Clear previous
    svg.selectAll('*').remove()

    svg.attr('width', width).attr('height', CHART_HEIGHT)

    const innerW = width - MARGIN.left - MARGIN.right
    const innerH = CHART_HEIGHT - MARGIN.top - MARGIN.bottom

    // Parse data
    const parseDate = d3.timeParse('%Y-%m-%d')
    const data = timeseries.map(d => ({
      date: parseDate(d.date) || new Date(d.date),
      visitors: d.visitors || 0,
      pageviews: d.pageviews || 0,
    }))

    // Scales
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date))
      .range([0, innerW])

    const maxY = d3.max(data, d => Math.max(d.visitors, d.pageviews)) || 10
    const y = d3.scaleLinear()
      .domain([0, maxY * 1.1])
      .range([innerH, 0])
      .nice()

    const g = svg.append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`)

    // Gradient defs
    const defs = svg.append('defs')

    // Visitors gradient
    const visitorGrad = defs.append('linearGradient')
      .attr('id', 'grad-visitors')
      .attr('x1', '0').attr('y1', '0')
      .attr('x2', '0').attr('y2', '1')
    visitorGrad.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#1a1a1a')
      .attr('stop-opacity', 0.05)
    visitorGrad.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#1a1a1a')
      .attr('stop-opacity', 0)

    // Pageviews gradient
    const pvGrad = defs.append('linearGradient')
      .attr('id', 'grad-pageviews')
      .attr('x1', '0').attr('y1', '0')
      .attr('x2', '0').attr('y2', '1')
    pvGrad.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#c1440e')
      .attr('stop-opacity', 0.05)
    pvGrad.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#c1440e')
      .attr('stop-opacity', 0)

    // Grid lines
    const yTicks = y.ticks(5)
    g.selectAll('.grid-line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerW)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .attr('stroke', '#1a1a1a')
      .attr('stroke-opacity', 0.2)
      .attr('stroke-width', 0.5)

    // Axes
    const xAxis = d3.axisBottom(x)
      .ticks(Math.min(data.length, 8))
      .tickSizeOuter(0)
      .tickSize(0)
      .tickPadding(8)

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(xAxis)
      .selectAll('text')
      .attr('font-size', '9px')
      .attr('fill', 'var(--text-muted)')
    g.selectAll('.domain').attr('stroke', 'var(--border)')

    const yAxis = d3.axisLeft(y)
      .ticks(5)
      .tickSizeOuter(0)
      .tickSize(0)
      .tickPadding(8)

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('font-size', '9px')
      .attr('fill', 'var(--text-muted)')
    g.selectAll('.domain').attr('stroke', 'var(--border)')

    // Area generators
    const areaVisitors = d3.area()
      .x(d => x(d.date))
      .y0(innerH)
      .y1(d => y(d.visitors))
      .curve(d3.curveMonotoneX)

    const areaPageviews = d3.area()
      .x(d => x(d.date))
      .y0(innerH)
      .y1(d => y(d.pageviews))
      .curve(d3.curveMonotoneX)

    const lineVisitors = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.visitors))
      .curve(d3.curveMonotoneX)

    const linePageviews = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.pageviews))
      .curve(d3.curveMonotoneX)

    // Draw areas
    g.append('path')
      .datum(data)
      .attr('fill', 'url(#grad-visitors)')
      .attr('d', areaVisitors)

    g.append('path')
      .datum(data)
      .attr('fill', 'url(#grad-pageviews)')
      .attr('d', areaPageviews)

    // Draw lines with animation
    const visitorLine = g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#1a1a1a')
      .attr('stroke-width', 1)
      .attr('d', lineVisitors)

    const pvLine = g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#c1440e')
      .attr('stroke-width', 1)
      .attr('d', linePageviews)

    // Draw-on animation
    if (!drawnRef.current) {
      ;[visitorLine, pvLine].forEach(path => {
        const totalLength = path.node().getTotalLength()
        path
          .attr('stroke-dasharray', totalLength)
          .attr('stroke-dashoffset', totalLength)
          .transition()
          .duration(800)
          .ease(d3.easeLinear)
          .attr('stroke-dashoffset', 0)
      })
      drawnRef.current = true
    }

    // Crosshair + tooltip
    const crosshair = g.append('line')
      .attr('y1', 0)
      .attr('y2', innerH)
      .attr('stroke', '#1a1a1a')
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0)

    const bisect = d3.bisector(d => d.date).left

    const overlay = g.append('rect')
      .attr('width', innerW)
      .attr('height', innerH)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')

    overlay.on('mousemove', (event) => {
      const [mx] = d3.pointer(event)
      const dateAtMouse = x.invert(mx)
      const idx = bisect(data, dateAtMouse, 1)
      const d0 = data[idx - 1]
      const d1 = data[idx]
      if (!d0) return
      const d = d1 && (dateAtMouse - d0.date > d1.date - dateAtMouse) ? d1 : d0
      const cx = x(d.date)

      crosshair
        .attr('x1', cx)
        .attr('x2', cx)
        .attr('opacity', 1)

      const formatDate = d3.timeFormat('%b %d, %Y')
      tooltip.style.opacity = '1'
      tooltip.innerHTML = `<div>${formatDate(d.date)}</div><div>VISITORS: ${d.visitors}</div><div>PAGEVIEWS: ${d.pageviews}</div>`

      const tooltipLeft = cx + MARGIN.left + 12
      const tooltipTop = Math.max(MARGIN.top, y(Math.max(d.visitors, d.pageviews)) + MARGIN.top - 20)
      // Flip if too close to right edge
      if (tooltipLeft + 140 > width) {
        tooltip.style.left = `${cx + MARGIN.left - 150}px`
      } else {
        tooltip.style.left = `${tooltipLeft}px`
      }
      tooltip.style.top = `${tooltipTop}px`
    })

    overlay.on('mouseleave', () => {
      crosshair.attr('opacity', 0)
      tooltip.style.opacity = '0'
    })
  }, [timeseries])

  // Draw on mount and data change
  useEffect(() => {
    drawnRef.current = false
    drawChart()
  }, [drawChart])

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(() => {
      drawChart()
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [drawChart])

  return (
    <div className="dash__chart" ref={containerRef}>
      <div className="dash__chart-header">
        <span className="dash__chart-title">TRAFFIC OVERVIEW</span>
        <div className="dash__chart-legend">
          <span className="dash__chart-legend-item">
            <span className="dash__chart-legend-line" style={{ background: '#1a1a1a' }} />
            VISITORS
          </span>
          <span className="dash__chart-legend-item">
            <span className="dash__chart-legend-line" style={{ background: '#c1440e' }} />
            PAGEVIEWS
          </span>
        </div>
      </div>
      <svg ref={svgRef} className="dash__chart-svg" />
      <div
        ref={tooltipRef}
        className="dash__tooltip"
        style={{ opacity: 0, fontFamily: 'monospace', lineHeight: 1.5 }}
      />
    </div>
  )
}

/* ========== Events Strip ========== */

// Maps display labels to Plausible event names from trackEvent() calls
const EVENT_MAP = [
  { label: 'EMAIL CLICKED', event: 'Email Click' },
  { label: 'CV DOWNLOADED', event: 'CV Download' },
  { label: 'GLITCH MODE', event: 'Glitch Mode' },
  { label: 'PROJECT VIEWS', event: 'Project View' },
  { label: 'ABOUT SCROLL', event: 'About Scroll' },
  { label: 'EXTERNAL LINK', event: 'External Link' },
]

function EventsStrip({ events }) {
  return (
    <div className="dash__events">
      {EVENT_MAP.map(({ label, event }) => {
        const eventData = events?.find(
          e => e.name === event
        )
        const value = eventData?.events ?? eventData?.visitors ?? null
        return (
          <div className="dash__event" key={label}>
            <span className="dash__event-name">{label}</span>
            <span className="dash__event-value">{value != null ? formatNumber(value) : '—'}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ========== Realtime Indicator ========== */

function RealtimeIndicator({ count }) {
  const [flash, setFlash] = useState(false)
  const prevRef = useRef(count)

  useEffect(() => {
    if (count !== prevRef.current) {
      setFlash(true)
      const timer = setTimeout(() => setFlash(false), 300)
      prevRef.current = count
      return () => clearTimeout(timer)
    }
  }, [count])

  return (
    <div className="dash__realtime">
      <span className="dash__realtime-dot" />
      <span className={`dash__realtime-count${flash ? ' dash__realtime-count--flash' : ''}`}>
        {count ?? 0} ACTIVE
      </span>
    </div>
  )
}

/* ========== Skeleton Loading ========== */

function SkeletonLoader() {
  const skeletonBlock = (w, h) => ({
    width: w,
    height: h,
    background: 'var(--border)',
    borderRadius: 0,
    animation: 'pulse 2s ease-in-out infinite',
    opacity: 0.5,
  })

  return (
    <div className="dash__body">
      {/* KPI skeleton */}
      <div className="dash__kpis" style={{ background: 'transparent', border: '0.5px solid var(--border)' }}>
        {[...Array(5)].map((_, i) => (
          <div className="dash__kpi" key={i}>
            <div style={skeletonBlock('60%', 8)} />
            <div style={{ ...skeletonBlock('40%', 28), marginTop: 8 }} />
            <div style={{ ...skeletonBlock('30%', 9), marginTop: 6 }} />
          </div>
        ))}
      </div>
      {/* Chart skeleton */}
      <div className="dash__chart">
        <div style={skeletonBlock('100%', 280)} />
      </div>
      {/* Breakdowns skeleton */}
      <div className="dash__breakdowns" style={{ background: 'transparent', border: '0.5px solid var(--border)' }}>
        {[...Array(6)].map((_, i) => (
          <div className="dash__panel" key={i}>
            <div style={skeletonBlock('40%', 8)} />
            {[...Array(5)].map((_, j) => (
              <div key={j} style={{ ...skeletonBlock(`${70 - j * 10}%`, 20), marginTop: 6 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ========== Dashboard View ========== */

const PERIODS = [
  { key: 'today', label: 'TODAY' },
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: '12mo', label: '12MO' },
]

function DashboardView() {
  const [period, setPeriod] = useState('30d')
  const [retryKey, setRetryKey] = useState(0)
  const [glitch, setGlitch] = useState(false)
  const data = usePlausible(period, retryKey)

  const handlePeriodChange = useCallback((newPeriod) => {
    if (newPeriod === period) return
    setGlitch(true)
    setTimeout(() => setGlitch(false), 150)
    setPeriod(newPeriod)
  }, [period])

  const handleRetry = useCallback(() => {
    setRetryKey(k => k + 1)
  }, [])

  const agg = data.aggregate

  return (
    <div className={`dash${glitch ? ' dash--glitch' : ''}`}>
      {/* Zone 1: Status Bar */}
      <div className="dash__status">
        <span className="dash__title">DASHBOARD // KEVINBOYLE.US</span>
        <div className="dash__periods">
          {PERIODS.map(p => (
            <button
              key={p.key}
              className={`dash__period-btn${period === p.key ? ' dash__period-btn--active' : ''}`}
              onClick={() => handlePeriodChange(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <RealtimeIndicator count={data.realtime} />
      </div>

      {/* Error state */}
      {data.error && (
        <div className="dash__error">
          ERROR: {data.error}
          <button
            style={{
              marginLeft: 16,
              fontFamily: 'var(--font)',
              fontSize: 9,
              letterSpacing: 1.5,
              padding: '4px 10px',
              border: '0.5px solid var(--accent)',
              background: 'transparent',
              color: 'var(--accent)',
              cursor: 'pointer',
            }}
            onClick={handleRetry}
          >
            RETRY
          </button>
        </div>
      )}

      {/* Loading state */}
      {data.loading && <SkeletonLoader />}

      {/* Main content */}
      {!data.loading && !data.error && (
        <div className="dash__body">
          {/* Zone 2: KPI Readouts */}
          <div className="dash__kpis">
            <KpiCard
              label="VISITORS"
              value={agg?.visitors?.value}
              change={agg?.visitors?.change}
              format="number"
            />
            <KpiCard
              label="PAGEVIEWS"
              value={agg?.pageviews?.value}
              change={agg?.pageviews?.change}
              format="number"
            />
            <KpiCard
              label="BOUNCE RATE"
              value={agg?.bounce_rate?.value}
              change={agg?.bounce_rate?.change}
              format="percent"
            />
            <KpiCard
              label="AVG DURATION"
              value={agg?.visit_duration?.value}
              change={agg?.visit_duration?.change}
              format="duration"
            />
            <KpiCard
              label="VIEWS/VISIT"
              value={agg?.views_per_visit?.value}
              change={agg?.views_per_visit?.change}
              format="decimal"
            />
          </div>

          {/* Zone 3: D3 Timeseries Chart */}
          <TimeseriesChart timeseries={data.timeseries} />

          {/* Zone 4: Breakdown Panels */}
          <div className="dash__breakdowns">
            <BreakdownPanel
              title="TOP PAGES"
              data={data.topPages}
              nameKey="page"
              valueKey="pageviews"
            />
            <BreakdownPanel
              title="SOURCES"
              data={data.sources}
              nameKey="source"
              valueKey="visitors"
            />
            <BreakdownPanel
              title="ENTRY PAGES"
              data={data.entryPages}
              nameKey="entry_page"
              valueKey="visitors"
            />
            <BreakdownPanel
              title="EXIT PAGES"
              data={data.exitPages}
              nameKey="exit_page"
              valueKey="visitors"
            />
            <BreakdownPanel
              title="COUNTRIES"
              data={data.countries}
              nameKey="country"
              valueKey="visitors"
            />
            <DevicesPanel
              devices={data.devices}
              browsers={data.browsers}
              os={data.os}
            />
          </div>

          {/* Zone 5: Custom Events Strip */}
          <EventsStrip events={data.events} />
        </div>
      )}
    </div>
  )
}

/* ========== Main Export ========== */

export default function Dashboard() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem('dashboard-auth') === '1'
  )

  if (!authed) return <PasswordGate onUnlock={() => setAuthed(true)} />

  return <DashboardView />
}
