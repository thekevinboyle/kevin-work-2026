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

export function usePlausible(period = '30d', retryKey = 0) {
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
  }, [period, retryKey])

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
