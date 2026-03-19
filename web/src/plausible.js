// Plausible custom event helper
// Falls back silently if plausible script hasn't loaded (e.g. ad blocker)
export function trackEvent(name, props) {
  if (typeof window.plausible === 'function') {
    window.plausible(name, props ? { props } : undefined)
  }
}
