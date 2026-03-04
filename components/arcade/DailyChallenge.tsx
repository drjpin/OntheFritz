'use client'

import { useState, useEffect, useCallback } from 'react'

interface DailyScore {
  username: string
  score: number
}

function timeUntilMidnight() {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setUTCHours(24, 0, 0, 0)
  const diff = midnight.getTime() - now.getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export default function DailyChallenge({ game }: { game: string }) {
  const [scores, setScores] = useState<DailyScore[]>([])
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(timeUntilMidnight())

  const fetchScores = useCallback(async () => {
    try {
      const res = await fetch(`/api/daily?game=${game}`)
      if (!res.ok) return
      const data = await res.json()
      setScores(data.scores || [])
    } catch { /* silently fail */ }
    setLoading(false)
  }, [game])

  useEffect(() => {
    fetchScores()
  }, [fetchScores])

  // Countdown timer
  useEffect(() => {
    const id = setInterval(() => setCountdown(timeUntilMidnight()), 1000)
    return () => clearInterval(id)
  }, [])

  // Re-fetch scores every minute
  useEffect(() => {
    const id = setInterval(fetchScores, 60000)
    return () => clearInterval(id)
  }, [fetchScores])

  const MEDALS = ['🥇', '🥈', '🥉']

  return (
    <div
      className="arcade-card"
      style={{
        border: '2px solid var(--neon-pink)',
        boxShadow: '0 0 12px rgba(255,0,110,0.15)',
        maxWidth: '480px',
        width: '100%',
        marginTop: '16px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <p style={{ fontFamily: 'Press Start 2P', fontSize: '10px', color: 'var(--neon-pink)', letterSpacing: '2px', marginBottom: '4px' }}>
            ⚡ DAILY CHALLENGE
          </p>
          <p className="vt323" style={{ color: 'rgba(255,0,110,0.5)', fontSize: '16px' }}>
            {todayLabel()} — resets in{' '}
            <span style={{ color: 'var(--neon-pink)', fontVariantNumeric: 'tabular-nums' }}>{countdown}</span>
          </p>
        </div>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--neon-pink)', boxShadow: '0 0 8px var(--neon-pink)', marginTop: '4px' }} className="pulse-glow" />
      </div>

      {/* Scores */}
      {loading ? (
        <p className="vt323 blink text-center" style={{ color: 'var(--neon-pink)', fontSize: '20px' }}>LOADING...</p>
      ) : scores.length === 0 ? (
        <p className="vt323 text-center" style={{ color: 'rgba(255,0,110,0.4)', fontSize: '18px' }}>
          No scores yet today.<br />Be the first on the board!
        </p>
      ) : (
        <div>
          {scores.map((s, i) => (
            <div
              key={i}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '7px 10px', marginBottom: '4px',
                background: i === 0 ? 'rgba(255,0,110,0.06)' : 'transparent',
                border: i === 0 ? '1px solid rgba(255,0,110,0.2)' : '1px solid transparent',
              }}
            >
              <span style={{ fontSize: i < 3 ? '18px' : '14px', minWidth: '24px', color: 'rgba(255,0,110,0.5)', fontFamily: 'Press Start 2P' }}>
                {i < 3 ? MEDALS[i] : `${i + 1}.`}
              </span>
              <span className="vt323" style={{ flex: 1, color: 'rgba(255,255,255,0.75)', fontSize: '18px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.username}
              </span>
              <span style={{ fontFamily: 'Press Start 2P', fontSize: '10px', color: i === 0 ? 'var(--neon-pink)' : 'rgba(255,0,110,0.7)' }}>
                {s.score.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="vt323" style={{ color: 'rgba(255,0,110,0.25)', fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>
        Submit your score via the High Scores panel to appear here
      </p>
    </div>
  )
}
