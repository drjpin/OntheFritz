'use client'

import { useState, useEffect, useCallback } from 'react'

type Score = {
  id: number
  game: string
  username: string
  score: number
  avatar_url: string | null
  created_at: string
}

const MEDALS = ['🥇', '🥈', '🥉']
const GAMES = ['breakout', 'snake', 'trism']
const GAME_LABELS: Record<string, string> = {
  breakout: 'BREAKOUT',
  snake: 'SNAKE',
  trism: 'TRISM',
}

interface LeaderboardProps {
  activeGame?: string
  pendingScore?: { game: string; score: number } | null
  onScoreSubmitted?: () => void
}

export default function Leaderboard({ activeGame, pendingScore, onScoreSubmitted }: LeaderboardProps) {
  const [scores, setScores] = useState<Score[]>([])
  const [selectedGame, setSelectedGame] = useState(activeGame || 'breakout')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [submitDone, setSubmitDone] = useState(false)
  const [showSubmit, setShowSubmit] = useState(false)

  const fetchScores = useCallback(async (game: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/scores?game=${game}`)
      const data = await res.json()
      setScores(data.scores || [])
    } catch {
      setScores([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchScores(selectedGame)
  }, [selectedGame, fetchScores])

  useEffect(() => {
    if (activeGame) setSelectedGame(activeGame)
  }, [activeGame])

  useEffect(() => {
    if (pendingScore) setShowSubmit(true)
  }, [pendingScore])

  const handleSubmitScore = async () => {
    if (!username.trim() || !pendingScore) return
    setSubmitting(true)
    try {
      await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game: pendingScore.game,
          username: username.trim(),
          score: pendingScore.score,
          avatar_url: avatarUrl || null,
        }),
      })
      setSubmitDone(true)
      setShowSubmit(false)
      fetchScores(pendingScore.game)
      onScoreSubmitted?.()
    } catch {
      // silently fail
    } finally {
      setSubmitting(false)
    }
  }

  const top3 = scores.slice(0, 3)
  const rest = scores.slice(3)

  return (
    <div className="arcade-card box-glow-green" style={{ maxWidth: '480px', width: '100%' }}>
      <p style={{ fontFamily: 'Press Start 2P', fontSize: '12px', letterSpacing: '3px', marginBottom: '20px' }} className="glow-green">
        HIGH SCORES
      </p>

      {/* Game tabs */}
      <div className="flex gap-2 mb-6">
        {GAMES.map(g => (
          <button
            key={g}
            onClick={() => setSelectedGame(g)}
            style={{
              fontFamily: 'Press Start 2P',
              fontSize: '8px',
              padding: '8px 10px',
              border: `2px solid ${selectedGame === g ? 'var(--neon-green)' : 'var(--border-glow)'}`,
              background: selectedGame === g ? 'rgba(0,255,159,0.1)' : 'transparent',
              color: selectedGame === g ? 'var(--neon-green)' : 'rgba(0,255,159,0.4)',
              cursor: 'pointer',
              boxShadow: selectedGame === g ? '0 0 8px var(--neon-green)' : 'none',
            }}
          >
            {GAME_LABELS[g]}
          </button>
        ))}
      </div>

      {/* Score list */}
      {loading ? (
        <p className="vt323 text-center blink" style={{ color: 'var(--neon-green)', fontSize: '22px' }}>LOADING...</p>
      ) : scores.length === 0 ? (
        <p className="vt323 text-center" style={{ color: 'rgba(0,255,159,0.4)', fontSize: '20px' }}>
          No scores yet. Be the first!
        </p>
      ) : (
        <div>
          {/* Top 3 with avatars */}
          {top3.map((s, i) => (
            <div
              key={s.id}
              className="flex items-center gap-3 mb-3 p-3"
              style={{
                background: i === 0 ? 'rgba(255,215,0,0.05)' : 'rgba(0,255,159,0.03)',
                border: `1px solid ${i === 0 ? 'rgba(255,215,0,0.2)' : 'var(--border-glow)'}`,
              }}
            >
              <span style={{ fontSize: '20px', minWidth: '28px' }}>{MEDALS[i]}</span>
              {s.avatar_url ? (
                <img
                  src={s.avatar_url}
                  alt={s.username}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--neon-green)', objectFit: 'cover' }}
                  onError={e => { e.currentTarget.style.display = 'none' }}
                />
              ) : (
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid rgba(0,255,159,0.3)', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'var(--neon-green)', fontFamily: 'Press Start 2P', fontSize: '10px' }}>
                    {s.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p style={{ fontFamily: 'Press Start 2P', fontSize: '9px', color: 'var(--neon-green)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.username}
                </p>
              </div>
              <p style={{ fontFamily: 'Press Start 2P', fontSize: '11px', color: i === 0 ? 'var(--neon-yellow)' : 'var(--neon-green)' }}>
                {s.score.toLocaleString()}
              </p>
            </div>
          ))}

          {/* Rest */}
          {rest.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 mb-2 px-3 py-2">
              <span className="vt323" style={{ color: 'rgba(0,255,159,0.4)', fontSize: '18px', minWidth: '28px' }}>
                {i + 4}.
              </span>
              <span className="vt323 flex-1" style={{ color: 'rgba(0,255,159,0.7)', fontSize: '18px' }}>{s.username}</span>
              <span className="vt323" style={{ color: 'var(--neon-green)', fontSize: '18px' }}>{s.score.toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Submit score panel */}
      {showSubmit && pendingScore && !submitDone && (
        <div className="mt-6 pt-4" style={{ borderTop: '2px solid var(--border-glow)' }}>
          <p style={{ fontFamily: 'Press Start 2P', fontSize: '9px', color: 'var(--neon-yellow)', marginBottom: '12px', letterSpacing: '2px' }}>
            SUBMIT YOUR SCORE: {pendingScore.score.toLocaleString()}
          </p>
          <input
            className="pixel-input mb-3"
            placeholder="Enter username (max 16 chars)"
            value={username}
            onChange={e => setUsername(e.target.value.slice(0, 16))}
            maxLength={16}
          />
          <input
            className="pixel-input mb-4"
            style={{ borderColor: 'var(--neon-cyan)' }}
            placeholder="Avatar image URL (optional)"
            value={avatarUrl}
            onChange={e => setAvatarUrl(e.target.value)}
          />
          <button
            className="pixel-btn"
            style={{ width: '100%' }}
            onClick={handleSubmitScore}
            disabled={submitting || !username.trim()}
          >
            {submitting ? <span className="blink">SUBMITTING...</span> : 'SUBMIT SCORE'}
          </button>
        </div>
      )}
      {submitDone && (
        <p className="vt323 text-center mt-4 glow-green" style={{ fontSize: '20px' }}>
          Score submitted! ✓
        </p>
      )}
    </div>
  )
}
