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
