# Analytics Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a private HUD-style analytics dashboard at `/dashboard` powered by Plausible Analytics, matching the site's brutalist aesthetic.

**Architecture:** React Router handles `/dashboard` route separately from the main portfolio SPA. A password gate protects the dashboard. A custom hook (`usePlausible`) wraps all Plausible Stats API calls. D3 renders the timeseries chart. All styles are hand-built CSS matching existing design tokens.

**Tech Stack:** React 19, React Router DOM 7, D3 7, Plausible Stats API v1, Vite 7

**Worktree:** `.worktrees/analytics-dashboard` on branch `feature/analytics-dashboard`

---

### Task 1: Add React Router and Route Splitting

**Files:**
- Modify: `web/src/main.jsx`
- Modify: `web/src/App.jsx:5171,5989`

**Step 1: Update main.jsx to use BrowserRouter**

Replace the contents of `web/src/main.jsx` with:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { lazy, Suspense } from 'react'

const Dashboard = lazy(() => import('./Dashboard.jsx'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={
          <Suspense fallback={null}>
            <Dashboard />
          </Suspense>
        } />
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
```

**Step 2: Create placeholder Dashboard.jsx**

Create `web/src/Dashboard.jsx`:

```jsx
export default function Dashboard() {
  return <div>Dashboard placeholder</div>
}
```

**Step 3: Verify both routes work**

Run: `npm run dev` in `web/`
- Visit `http://localhost:5173/` — should show the portfolio as before
- Visit `http://localhost:5173/dashboard` — should show "Dashboard placeholder"

**Step 4: Commit**

```bash
git add web/src/main.jsx web/src/Dashboard.jsx
git commit -m "feat: add React Router with lazy-loaded /dashboard route"
```

---

### Task 2: Add Plausible Tracking Script and Event Helpers

**Files:**
- Modify: `web/index.html:12-13`
- Create: `web/src/plausible.js`
- Modify: `web/src/App.jsx` (event calls at specific click handlers)

**Step 1: Add Plausible script tag to index.html**

Insert before the closing `</head>` tag (after the font preloads, line 11):

```html
    <script defer data-domain="kevinboyle.us" src="https://plausible.io/js/script.js"></script>
```

**Step 2: Create event helper**

Create `web/src/plausible.js`:

```js
// Plausible custom event helper
// Falls back silently if plausible script hasn't loaded (e.g. ad blocker)
export function trackEvent(name, props) {
  if (typeof window.plausible === 'function') {
    window.plausible(name, props ? { props } : undefined)
  }
}
```

**Step 3: Add event tracking calls to App.jsx**

Import at the top of `web/src/App.jsx` (line 6, after SoundEngine import):

```js
import { trackEvent } from './plausible';
```

Add tracking calls at these locations in App.jsx:

**Email Click** — line 5307, the mailto link. Wrap in an onClick:
```jsx
<a href="mailto:thekevinboyle@gmail.com" onClick={() => trackEvent('Email Click')}>Email &#x2197;</a>
```

**CV Download** — line 5309:
```jsx
<a href="/kevin-boyle-general-2026.pdf" target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('CV Download')}>CV &#x2197;</a>
```

**About Scroll** — line 5308, add tracking to existing onClick:
```jsx
<a href="#about" onClick={(e) => { e.preventDefault(); trackEvent('About Scroll'); document.querySelector('.about-section')?.scrollIntoView({ behavior: 'smooth' }); }}>About &#x2197;</a>
```

**Glitch Mode** — line 5299, in the setGlitchMode handler:
```jsx
onClick={!isMobile && !glitchMode ? () => { trackEvent('Glitch Mode'); setGlitchMode(true); } : undefined}
```

**Project View** — line 5277-5289, inside the `handleSelect` callback, when selecting (not deselecting):
```js
const handleSelect = useCallback((id) => {
    const newId = selectedId === id ? null : id;
    if (newId) {
      const project = allProjects.find(p => p.id === newId);
      trackEvent('Project View', { project: project?.details?.title || newId });
    }
    if (selectedId && newId) {
      setTransitioning(true);
      setTimeout(() => {
        setSelectedId(newId);
        setTransitioning(false);
      }, 250);
    } else {
      setSelectedId(newId);
    }
  }, [selectedId]);
```

**External Links** — lines 5357-5360, add onClick to each:
```jsx
<a href="https://weareallgonners.bandcamp.com/" target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('External Link', { destination: 'Bandcamp' })}>Bandcamp &#x2197;</a>
<a href="https://github.com/thekevinboyle" target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('External Link', { destination: 'GitHub' })}>GitHub &#x2197;</a>
<a href="https://www.linkedin.com/in/thekevinboyle/" target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('External Link', { destination: 'LinkedIn' })}>LinkedIn &#x2197;</a>
<a href="https://transgressive.libsyn.com/" target="_blank" rel="noopener noreferrer" onClick={() => trackEvent('External Link', { destination: 'Podcast' })}>Transgressive Podcast &#x2197;</a>
```

**Footer Email** — line 5396:
```jsx
<a href="mailto:thekevinboyle@gmail.com?subject=Ayoo" className="footer-cta__link" onClick={() => trackEvent('Email Click')}>Send a signal</a>
```

**Step 4: Verify the site still works**

Run dev server and check the portfolio loads without console errors. Plausible calls will fail silently until the domain is registered.

**Step 5: Commit**

```bash
git add web/index.html web/src/plausible.js web/src/App.jsx
git commit -m "feat: add Plausible tracking script and custom event tracking"
```

---

### Task 3: Build the Plausible API Hook

**Files:**
- Create: `web/src/hooks/usePlausible.js`

**Step 1: Create the hook**

Create `web/src/hooks/usePlausible.js`:

```js
import { useState, useEffect, useCallback, useRef } from 'react'

const API_BASE = 'https://plausible.io/api/v1/stats'
const SITE_ID = 'kevinboyle.us'

function apiHeaders() {
  return {
    Authorization: `Bearer ${import.meta.env.VITE_PLAUSIBLE_API_KEY}`,
  }
}

const PERIOD_MAP = {
  'today': 'day',
  '7d': '7d',
  '30d': '30d',
  '12mo': '12mo',
}

async function fetchApi(endpoint, params = {}) {
  const url = new URL(`${API_BASE}/${endpoint}`)
  url.searchParams.set('site_id', SITE_ID)
  Object.entries(params).forEach(([k, v]) => {
    if (v != null) url.searchParams.set(k, v)
  })
  const res = await fetch(url, { headers: apiHeaders() })
  if (!res.ok) throw new Error(`Plausible API ${res.status}: ${res.statusText}`)
  return res.json()
}

export function usePlausible(period = '30d') {
  const [data, setData] = useState({
    realtime: 0,
    aggregate: null,
    timeseries: null,
    topPages: null,
    sources: null,
    countries: null,
    devices: null,
    browsers: null,
    os: null,
    entryPages: null,
    exitPages: null,
    events: null,
    loading: true,
    error: null,
  })

  const realtimeRef = useRef(null)

  const fetchRealtime = useCallback(async () => {
    try {
      const res = await fetchApi('realtime/visitors')
      setData(prev => ({ ...prev, realtime: res }))
    } catch {
      // Silently fail for realtime — non-critical
    }
  }, [])

  const fetchAll = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true, error: null }))
    const p = PERIOD_MAP[period] || '30d'
    try {
      const [
        aggregate,
        timeseries,
        topPages,
        sources,
        countries,
        devices,
        browsers,
        os,
        entryPages,
        exitPages,
      ] = await Promise.all([
        fetchApi('aggregate', {
          period: p,
          metrics: 'visitors,pageviews,bounce_rate,visit_duration,views_per_visit',
          compare: 'previous_period',
        }),
        fetchApi('timeseries', {
          period: p,
          metrics: 'visitors,pageviews',
        }),
        fetchApi('breakdown', {
          period: p,
          property: 'event:page',
          metrics: 'visitors,pageviews',
          limit: 10,
        }),
        fetchApi('breakdown', {
          period: p,
          property: 'visit:source',
          metrics: 'visitors',
          limit: 10,
        }),
        fetchApi('breakdown', {
          period: p,
          property: 'visit:country',
          metrics: 'visitors',
          limit: 10,
        }),
        fetchApi('breakdown', {
          period: p,
          property: 'visit:device',
          metrics: 'visitors',
          limit: 10,
        }),
        fetchApi('breakdown', {
          period: p,
          property: 'visit:browser',
          metrics: 'visitors',
          limit: 10,
        }),
        fetchApi('breakdown', {
          period: p,
          property: 'visit:os',
          metrics: 'visitors',
          limit: 10,
        }),
        fetchApi('breakdown', {
          period: p,
          property: 'visit:entry_page',
          metrics: 'visitors',
          limit: 10,
        }),
        fetchApi('breakdown', {
          period: p,
          property: 'visit:exit_page',
          metrics: 'visitors',
          limit: 10,
        }),
      ])

      setData(prev => ({
        ...prev,
        aggregate: aggregate.results,
        timeseries: timeseries.results,
        topPages: topPages.results,
        sources: sources.results,
        countries: countries.results,
        devices: devices.results,
        browsers: browsers.results,
        os: os.results,
        entryPages: entryPages.results,
        exitPages: exitPages.results,
        loading: false,
      }))
    } catch (err) {
      setData(prev => ({ ...prev, loading: false, error: err.message }))
    }
  }, [period])

  // Fetch all data when period changes
  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Poll realtime every 30s
  useEffect(() => {
    fetchRealtime()
    realtimeRef.current = setInterval(fetchRealtime, 30000)
    return () => clearInterval(realtimeRef.current)
  }, [fetchRealtime])

  return data
}
```

**Step 2: Commit**

```bash
git add web/src/hooks/usePlausible.js
git commit -m "feat: add usePlausible hook for Stats API data fetching"
```

---

### Task 4: Build Password Gate Component

**Files:**
- Modify: `web/src/Dashboard.jsx`
- Create: `web/src/dashboard.css`

**Step 1: Build the password gate and dashboard shell**

Replace `web/src/Dashboard.jsx` with:

```jsx
import { useState } from 'react'
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

export default function Dashboard() {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem('dashboard-auth') === '1'
  )

  if (!authed) return <PasswordGate onUnlock={() => setAuthed(true)} />

  return (
    <div className="dash">
      <div className="dash__status">
        <span className="dash__title">DASHBOARD // KEVINBOYLE.US</span>
      </div>
      <div className="dash__body">
        <p style={{ color: 'var(--text-muted)' }}>Loading metrics...</p>
      </div>
    </div>
  )
}
```

**Step 2: Create dashboard.css with gate styles and base layout**

Create `web/src/dashboard.css`:

```css
/* ========================
   DASHBOARD — HUD Command Center
   ======================== */

.dash-gate {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  font-family: var(--font);
}

.dash-gate__form {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.dash-gate__label {
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--text-muted);
  font-weight: 500;
}

.dash-gate__input {
  font-family: var(--font);
  font-size: 14px;
  letter-spacing: 1px;
  padding: 10px 16px;
  border: 0.5px solid var(--border);
  background: transparent;
  color: var(--text);
  text-align: center;
  outline: none;
  width: 280px;
  transition: border-color 0.2s;
}

.dash-gate__input:focus {
  border-color: var(--accent);
}

.dash-gate__input::placeholder {
  color: var(--text-muted);
  font-size: 10px;
  letter-spacing: 2px;
}

.dash-gate__error {
  font-size: 9px;
  letter-spacing: 1.5px;
  color: var(--accent);
}

/* ========================
   DASHBOARD LAYOUT
   ======================== */

.dash {
  width: 100%;
  min-height: 100vh;
  background: var(--bg);
  font-family: var(--font);
  overflow-y: auto;
}

/* Zone 1: Status Bar */
.dash__status {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  border-bottom: 0.5px solid var(--border);
  background: var(--bg);
}

.dash__title {
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 2px;
  color: var(--text-muted);
}

.dash__body {
  padding: 24px;
}

/* Zone 1: Period Selector */
.dash__periods {
  display: flex;
  gap: 2px;
}

.dash__period-btn {
  font-family: var(--font);
  font-size: 9px;
  letter-spacing: 1.5px;
  font-weight: 500;
  padding: 4px 10px;
  border: 0.5px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.dash__period-btn:hover {
  color: var(--text);
  border-color: var(--text-muted);
}

.dash__period-btn--active {
  color: var(--bg);
  background: var(--text);
  border-color: var(--text);
}

/* Realtime indicator */
.dash__realtime {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 9px;
  letter-spacing: 1.5px;
  font-weight: 500;
  color: var(--text-muted);
}

.dash__realtime-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.dash__realtime-count {
  transition: color 0.3s;
}

.dash__realtime-count--flash {
  color: var(--accent);
}

/* Zone 2: KPI Readouts */
.dash__kpis {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1px;
  background: var(--border);
  margin: 0 24px;
  border: 0.5px solid var(--border);
}

.dash__kpi {
  background: var(--bg);
  padding: 16px 20px;
  position: relative;
}

.dash__kpi-label {
  font-size: 8px;
  letter-spacing: 2px;
  color: var(--text-muted);
  font-weight: 500;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dash__kpi-value {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
  line-height: 1;
  color: var(--text);
}

.dash__kpi-delta {
  font-size: 9px;
  letter-spacing: 0.5px;
  margin-top: 6px;
  font-weight: 500;
}

.dash__kpi-delta--up {
  color: var(--accent);
}

.dash__kpi-delta--down {
  color: var(--text-muted);
}

/* Registration marks on KPI corners */
.dash__kpi::before {
  content: '';
  position: absolute;
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  border-top: 0.5px solid var(--accent);
  border-right: 0.5px solid var(--accent);
  opacity: 0.4;
}

/* Zone 3: Timeseries Chart */
.dash__chart {
  margin: 24px;
  padding: 20px;
  border: 0.5px solid var(--border);
  position: relative;
  overflow: hidden;
}

.dash__chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.dash__chart-title {
  font-size: 8px;
  letter-spacing: 2px;
  color: var(--text-muted);
  font-weight: 500;
}

.dash__chart-legend {
  display: flex;
  gap: 16px;
}

.dash__chart-legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 8px;
  letter-spacing: 1px;
  color: var(--text-muted);
}

.dash__chart-legend-line {
  width: 16px;
  height: 1px;
}

.dash__chart-svg {
  width: 100%;
  display: block;
}

/* Scan-line overlay */
.dash__chart::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.015) 2px,
    rgba(0, 0, 0, 0.015) 4px
  );
  pointer-events: none;
}

/* Chart tooltip */
.dash__tooltip {
  position: absolute;
  pointer-events: none;
  font-size: 10px;
  letter-spacing: 0.5px;
  font-family: var(--font);
  padding: 6px 10px;
  border: 0.5px solid var(--border);
  background: var(--bg);
  color: var(--text);
  white-space: nowrap;
  z-index: 10;
}

/* Zone 4: Breakdown Panels */
.dash__breakdowns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: var(--border);
  margin: 0 24px;
  border: 0.5px solid var(--border);
}

.dash__panel {
  background: var(--bg);
  padding: 20px;
}

.dash__panel-title {
  font-size: 8px;
  letter-spacing: 2px;
  color: var(--text-muted);
  font-weight: 500;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.dash__panel-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 0;
  position: relative;
  font-size: 12px;
  color: var(--text);
}

.dash__panel-row-bar {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: rgba(193, 68, 14, 0.08);
  transition: background 0.2s, width 0.5s ease-out;
  border-radius: 0;
}

.dash__panel-row:hover .dash__panel-row-bar {
  background: rgba(193, 68, 14, 0.18);
}

.dash__panel-row-name {
  position: relative;
  z-index: 1;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 70%;
}

.dash__panel-row-value {
  position: relative;
  z-index: 1;
  font-size: 11px;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

/* Fade out last rows */
.dash__panel-row:nth-last-child(-n+2) {
  opacity: 0.5;
}

/* Device tabs */
.dash__device-tabs {
  display: flex;
  gap: 2px;
  margin-bottom: 12px;
}

.dash__device-tab {
  font-family: var(--font);
  font-size: 8px;
  letter-spacing: 1.5px;
  padding: 3px 8px;
  border: 0.5px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
}

.dash__device-tab--active {
  color: var(--text);
  border-color: var(--text);
}

/* Zone 5: Custom Events */
.dash__events {
  display: flex;
  gap: 1px;
  background: var(--border);
  margin: 1px 24px 24px;
  border: 0.5px solid var(--border);
}

.dash__event {
  flex: 1;
  background: var(--bg);
  padding: 14px 20px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.dash__event-name {
  font-size: 8px;
  letter-spacing: 2px;
  color: var(--text-muted);
  font-weight: 500;
}

.dash__event-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  font-variant-numeric: tabular-nums;
}

/* Glitch micro-effect on period switch */
@keyframes dash-glitch {
  0% { transform: translateX(0); }
  20% { transform: translateX(-2px); }
  40% { transform: translateX(3px); }
  60% { transform: translateX(-1px); }
  80% { transform: translateX(1px); }
  100% { transform: translateX(0); }
}

.dash--glitch .dash__kpis,
.dash--glitch .dash__chart,
.dash--glitch .dash__breakdowns,
.dash--glitch .dash__events {
  animation: dash-glitch 0.15s ease-out;
}

/* Loading state */
.dash__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  font-size: 9px;
  letter-spacing: 2px;
  color: var(--text-muted);
}

/* Error state */
.dash__error {
  margin: 24px;
  padding: 16px 20px;
  border: 0.5px solid var(--accent);
  font-size: 11px;
  color: var(--accent);
  letter-spacing: 0.5px;
}

/* Responsive: stack on mobile */
@media (max-width: 768px) {
  .dash__kpis {
    grid-template-columns: repeat(2, 1fr);
  }
  .dash__kpis .dash__kpi:last-child {
    grid-column: span 2;
  }
  .dash__breakdowns {
    grid-template-columns: 1fr;
  }
  .dash__events {
    flex-direction: column;
  }
  .dash__status {
    flex-wrap: wrap;
    gap: 8px;
  }
}
```

**Step 3: Verify password gate works**

Visit `/dashboard` — should show the centered password input styled with ISO font. Enter anything — should show error. (Actual password won't work until `.env` is set up.)

**Step 4: Commit**

```bash
git add web/src/Dashboard.jsx web/src/dashboard.css
git commit -m "feat: add password gate and dashboard CSS with HUD styling"
```

---

### Task 5: Build the Full Dashboard UI

**Files:**
- Modify: `web/src/Dashboard.jsx`

**Step 1: Replace Dashboard.jsx with the full implementation**

Replace `web/src/Dashboard.jsx` with the full dashboard that wires up usePlausible, renders all 5 zones (status bar, KPIs, timeseries chart, breakdowns, custom events), and handles period switching with the glitch micro-effect.

The component structure:

```
Dashboard (auth check)
├── PasswordGate (if not authed)
└── DashboardView (if authed)
    ├── StatusBar (title, periods, realtime)
    ├── KPIRow (5 metric cards with deltas)
    ├── TimeseriesChart (D3 area chart)
    ├── BreakdownGrid (6 panels in 2-col grid)
    │   ├── BreakdownPanel (top pages)
    │   ├── BreakdownPanel (sources)
    │   ├── BreakdownPanel (entry pages)
    │   ├── BreakdownPanel (exit pages)
    │   ├── BreakdownPanel (countries)
    │   └── DevicePanel (device/browser/os tabs)
    └── EventsRow (custom event counts)
```

Key implementation details:

- `TimeseriesChart` uses D3 to render an SVG area chart with:
  - `d3.scaleTime` for x-axis, `d3.scaleLinear` for y-axis
  - `d3.area` generator with `curveMonotoneX` for smooth lines
  - Mouse move handler for crosshair + tooltip
  - Draw-on animation via SVG `stroke-dashoffset` transition

- `BreakdownPanel` takes `title`, `data[]`, `nameKey`, `valueKey` props. Renders rows with animated horizontal bars (width set as percentage of max value).

- `DevicePanel` has 3 sub-tabs (Device, Browser, OS) toggling which breakdown data is shown.

- Period switching sets a `glitch` CSS class on `.dash` for 150ms to trigger the displacement animation, then fetches new data.

- KPI values use a `CountUp` effect — a `useEffect` that increments from previous value to new value over 400ms using `requestAnimationFrame`.

- Realtime count flashes `#c1440e` when the value changes by toggling a `--flash` class for 300ms.

**Step 2: Verify the dashboard renders**

Create a `.env` file in `web/` with test values:
```
VITE_DASHBOARD_PASSWORD=test
VITE_PLAUSIBLE_API_KEY=your-key-here
```

Visit `/dashboard`, enter "test". The dashboard shell should render. API calls will fail (no valid key yet) and show the error state — that's expected.

**Step 3: Commit**

```bash
git add web/src/Dashboard.jsx
git commit -m "feat: build full dashboard UI with KPIs, D3 chart, breakdowns, and events"
```

---

### Task 6: Build the D3 Timeseries Chart

**Files:**
- Modify: `web/src/Dashboard.jsx` (TimeseriesChart component)

This is the most complex visual component. Implementation details:

**Step 1: Implement TimeseriesChart**

The chart component:
- Takes `data` (array of `{ date, visitors, pageviews }`) as prop
- Uses `useRef` for the SVG element and `useEffect` for D3 bindings
- Responsive: uses `ResizeObserver` to re-render on container resize
- Renders:
  - X-axis with date labels (ISO Light, 9px)
  - Y-axis with value labels (ISO Light, 9px)
  - Grid lines at 20% opacity
  - Two area paths: visitors (stroke `#1a1a1a`) and pageviews (stroke `#c1440e`)
  - Gradient fill under each line at 5% opacity
  - Crosshair vertical line on mouse move
  - Tooltip positioned near crosshair showing date + values

**Step 2: Verify chart renders with mock data**

Temporarily inject mock timeseries data to verify the chart draws correctly before connecting to the real API.

**Step 3: Commit**

```bash
git add web/src/Dashboard.jsx
git commit -m "feat: implement D3 timeseries area chart with crosshair tooltip"
```

---

### Task 7: Polish, Responsive, and Error States

**Files:**
- Modify: `web/src/Dashboard.jsx`
- Modify: `web/src/dashboard.css`

**Step 1: Add loading skeleton state**

When `data.loading` is true, show a pulsing skeleton layout matching the dashboard structure (gray blocks where data will be).

**Step 2: Add error state**

When `data.error` is set, show the error message in the `.dash__error` styled block with a retry button.

**Step 3: Add responsive breakpoints**

The CSS already has mobile breakpoints. Verify on narrow viewports:
- KPIs collapse to 2-column grid
- Breakdowns stack to single column
- Events stack vertically
- Status bar wraps gracefully

**Step 4: Test the full flow**

1. Visit `/dashboard` — see password gate
2. Enter password — see loading state
3. Data loads (or error if no API key) — see full dashboard
4. Switch periods — see glitch effect + data reload
5. Resize window — verify responsive layout

**Step 5: Commit**

```bash
git add web/src/Dashboard.jsx web/src/dashboard.css
git commit -m "feat: add loading skeleton, error states, and responsive polish"
```

---

### Summary of Commits

| # | Commit | What it does |
|---|--------|-------------|
| 1 | React Router + lazy dashboard route | Routing infrastructure |
| 2 | Plausible script + custom events | Analytics data collection |
| 3 | usePlausible hook | API data fetching layer |
| 4 | Password gate + dashboard CSS | Auth + all HUD styles |
| 5 | Full dashboard UI | All 5 zones wired up |
| 6 | D3 timeseries chart | The main visualization |
| 7 | Polish + error states | Loading, errors, responsive |
