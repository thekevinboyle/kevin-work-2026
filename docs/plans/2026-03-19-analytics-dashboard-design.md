# Analytics Dashboard — HUD Command Center

**Date:** 2026-03-19
**Status:** Design complete, ready for implementation

## Overview

A private analytics dashboard at `/dashboard` on kevinboyle.us, powered by Plausible Analytics and styled as a HUD command center matching the site's brutalist/technical aesthetic. Zero new dependencies — built with D3 (already installed) and vanilla CSS.

## Architecture

### Data Source: Plausible Analytics

- Plausible Cloud (~$9/mo) or self-hosted
- Privacy-friendly, no cookies, GDPR-compliant, ~1KB tracking script
- Stats API provides aggregate, timeseries, and breakdown endpoints

### Auth

- Simple password gate wrapping the dashboard route
- Single password checked against `VITE_DASHBOARD_PASSWORD` env var
- On correct entry, flag stored in `sessionStorage` for the tab duration

### Data Flow

On mount, parallel requests to Plausible's API:

| Endpoint | Purpose | Refresh |
|---|---|---|
| `GET /api/v1/stats/realtime/visitors` | Live visitor count | Polled every 30s |
| `GET /api/v1/stats/aggregate` | KPI metrics (visitors, pageviews, bounce_rate, visit_duration, views_per_visit) | On period change |
| `GET /api/v1/stats/timeseries` | Daily visitor/pageview data for selected period | On period change |
| `GET /api/v1/stats/breakdown` | Top pages, sources, countries, devices, browsers, OS, entry/exit pages | On period change |

All API calls made client-side to `plausible.io/api/v1/stats/*`. API key stored as `VITE_PLAUSIBLE_API_KEY`. No backend needed.

### Time Ranges

- Realtime visitor count (always visible)
- Period presets: Today, Last 7 Days, Last 30 Days, Last 12 Months

## Visual Layout

Single scrollable view divided into 5 zones, framed with registration marks matching the rest of the site.

### Zone 1: Status Bar (fixed top)

- Left: `DASHBOARD // KEVINBOYLE.US` in ISO mono
- Center: Period selector — four pill toggles (`TODAY` / `7D` / `30D` / `12MO`), styled like existing grid controls HUD
- Right: Realtime visitor count with blinking dot — `● 3 ACTIVE`

### Zone 2: KPI Readouts (top row, 5 columns)

Five monospaced data blocks in a horizontal strip:

| VISITORS | PAGEVIEWS | BOUNCE | AVG DURATION | VIEWS/VISIT |
|---|---|---|---|---|

Each block shows:
- Label in small caps
- Large numeric value in ISO Bold
- Delta vs. previous period (`+12.4%` in `#c1440e` orange, `-3.1%` in `#888`)
- Framed with hairline borders and corner registration marks
- Rolling counter animation on load/period change

### Zone 3: Timeseries (full width)

D3-rendered area chart:
- Thin stroke lines (1px), subtle gradient fill at ~5% opacity
- Crosshair cursor snapping to data points
- Floating monospaced tooltip (no rounded corners, no shadows, thin border)
- Grid lines at 20% opacity, axis labels in ISO Light
- Subtle scan-line overlay
- Draw-on animation left-to-right (~800ms) on load

### Zone 4: Breakdowns (2-column grid)

Six panels, each a ranked list (top 10) with horizontal bar indicators:

| Left Column | Right Column |
|---|---|
| **TOP PAGES** — path + view count | **SOURCES** — referrer + visitor count |
| **ENTRY PAGES** — where visitors land | **EXIT PAGES** — where they leave |
| **COUNTRIES** — flag + name + count | **DEVICES** — device/browser/OS tabs |

- Horizontal bars use `#c1440e` at 15% opacity
- Bars animate from 0 to target width (~500ms, staggered 50ms/row)
- Hover brightens bar fill to 30% opacity
- Subtle fade on last 2-3 rows

### Zone 5: Custom Events (full width, bottom)

Inline data readouts strip:
`EMAIL CLICKED: 14 / CV DOWNLOADED: 8 / GLITCH MODE: 23 / PROJECT VIEWS: 47`

Same monospaced treatment as KPI row.

## Interaction & Motion

### Period Switching
- Micro glitch-frame effect on all data zones (single-frame 2-3px horizontal displacement)
- KPI numbers roll to new values over ~400ms

### Realtime Indicator
- CSS pulse animation on dot (opacity 1 → 0.3, 2s cycle)
- Number flashes `#c1440e` on change, then settles to `#1a1a1a`

### Scroll Behavior
- Zone 1 (status bar) sticky at top
- No Lenis smooth scroll on dashboard route — data readability over aesthetics

### Sound
- No audio on the dashboard

## Custom Event Tracking

Events added to the existing portfolio site via `plausible()` calls:

| Event Name | Trigger | Custom Properties |
|---|---|---|
| `Email Click` | User clicks mailto link | — |
| `CV Download` | User clicks CV PDF link | — |
| `Glitch Mode` | User activates glitch mode | — |
| `Project View` | User selects a project | `{ project: 'project-name' }` |
| `About Scroll` | User clicks About nav link | — |
| `External Link` | User clicks social links | `{ destination: 'github' }` |

Implementation: `plausible('Event Name', { props: { key: 'value' } })`

## File Structure

### New Files
- `src/Dashboard.jsx` — Password gate + dashboard layout + data fetching
- `src/dashboard.css` — Dashboard-specific styles (HUD panels, charts, animations)
- `src/hooks/usePlausible.js` — Custom hook wrapping Plausible API calls with period/caching logic

### Modified Files
- `src/App.jsx` — Add React Router route for `/dashboard`
- `src/main.jsx` — Wrap App in `BrowserRouter`
- `index.html` — Add Plausible tracking script

### No New Dependencies
D3 already installed. No Tailwind, Tremor, or Recharts. Hand-built to match existing aesthetic.

## Setup Required (Manual)

1. Create Plausible Cloud account or self-host
2. Add `kevinboyle.us` as a site
3. Generate Stats API key
4. Create `.env` with `VITE_DASHBOARD_PASSWORD` and `VITE_PLAUSIBLE_API_KEY`
