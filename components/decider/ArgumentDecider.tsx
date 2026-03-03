'use client'

import { useState } from 'react'

export default function ArgumentDecider() {
  const [topic, setTopic] = useState('')
  const [sideA, setSideA] = useState('')
  const [sideB, setSideB] = useState('')
  const [verdict, setVerdict] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [voted, setVoted] = useState<'agree' | 'disagree' | null>(null)
  const [votes, setVotes] = useState({ agree: 0, disagree: 0 })

  const handleSubmit = async () => {
    if (!sideA.trim() || !sideB.trim()) {
      setError('Both sides need to plead their case, counselor.')
      return
    }
    setLoading(true)
    setError('')
    setVerdict('')
    setVoted(null)
    setVotes({ agree: 0, disagree: 0 })

    try {
      const res = await fetch('/api/argue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, sideA, sideB }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setVerdict(data.verdict)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. The Decider is in a mood.')
    } finally {
      setLoading(false)
    }
  }

  const handleVote = (type: 'agree' | 'disagree') => {
    if (voted) return
    setVoted(type)
    setVotes(prev => ({ ...prev, [type]: prev[type] + 1 }))
  }

  const totalVotes = votes.agree + votes.disagree
  const agreePercent = totalVotes > 0 ? Math.round((votes.agree / totalVotes) * 100) : 50
  const disagreePercent = 100 - agreePercent

  return (
    <div className="max-w-2xl mx-auto">
      {/* Topic */}
      <div className="mb-6">
        <label className="block mb-2" style={{ fontFamily: 'Press Start 2P', fontSize: '9px', color: 'var(--neon-cyan)', letterSpacing: '2px' }}>
          THE DISPUTE (optional)
        </label>
        <input
          className="pixel-input"
          placeholder="e.g. 'who should do the dishes'"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          maxLength={80}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Side A */}
        <div>
          <label className="block mb-2" style={{ fontFamily: 'Press Start 2P', fontSize: '9px', color: 'var(--neon-green)', letterSpacing: '2px' }}>
            SIDE A ARGUES:
          </label>
          <textarea
            className="pixel-input"
            style={{ minHeight: '120px', resize: 'vertical' }}
            placeholder="Make your case..."
            value={sideA}
            onChange={e => setSideA(e.target.value)}
            maxLength={300}
          />
          <p className="vt323 mt-1" style={{ color: 'rgba(0,255,159,0.4)', fontSize: '16px' }}>{sideA.length}/300</p>
        </div>

        {/* Side B */}
        <div>
          <label className="block mb-2" style={{ fontFamily: 'Press Start 2P', fontSize: '9px', color: 'var(--neon-pink)', letterSpacing: '2px' }}>
            SIDE B ARGUES:
          </label>
          <textarea
            className="pixel-input"
            style={{
              minHeight: '120px',
              resize: 'vertical',
              borderColor: 'var(--neon-pink)',
              background: 'rgba(255,0,110,0.05)',
            }}
            placeholder="Counter your opponent..."
            value={sideB}
            onChange={e => setSideB(e.target.value)}
            maxLength={300}
          />
          <p className="vt323 mt-1" style={{ color: 'rgba(255,0,110,0.4)', fontSize: '16px' }}>{sideB.length}/300</p>
        </div>
      </div>

      {error && (
        <p className="vt323 mb-4 text-center" style={{ color: 'var(--neon-yellow)', fontSize: '20px' }}>
          ⚠ {error}
        </p>
      )}

      <div className="flex justify-center mb-8">
        <button
          className="pixel-btn pixel-btn-pink"
          style={{ fontSize: '12px', padding: '16px 32px' }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <span className="blink">DECIDING...</span>
          ) : (
            'LET THE DECIDER JUDGE'
          )}
        </button>
      </div>

      {/* Verdict */}
      {verdict && (
        <div
          className="arcade-card box-glow-pink mb-6"
          style={{ borderColor: 'var(--neon-pink)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span style={{ fontSize: '24px' }}>⚖️</span>
            <p style={{ fontFamily: 'Press Start 2P', fontSize: '11px', color: 'var(--neon-pink)' }}>
              THE VERDICT
            </p>
          </div>
          <p className="vt323" style={{ fontSize: '22px', lineHeight: '1.5', color: '#ffffff', whiteSpace: 'pre-wrap' }}>
            {verdict}
          </p>

          {/* Vote on verdict */}
          <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--border-glow)' }}>
            <p style={{ fontFamily: 'Press Start 2P', fontSize: '9px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px', letterSpacing: '2px' }}>
              DO YOU AGREE WITH THE DECIDER?
            </p>
            <div className="flex gap-4 mb-4">
              <button
                className="pixel-btn"
                style={{ flex: 1, fontSize: '10px', opacity: voted === 'disagree' ? 0.4 : 1 }}
                onClick={() => handleVote('agree')}
                disabled={!!voted}
              >
                {voted === 'agree' ? '✓ AGREED' : 'AGREE'}
              </button>
              <button
                className="pixel-btn pixel-btn-pink"
                style={{ flex: 1, fontSize: '10px', opacity: voted === 'agree' ? 0.4 : 1 }}
                onClick={() => handleVote('disagree')}
                disabled={!!voted}
              >
                {voted === 'disagree' ? '✓ DISSENTED' : 'DISAGREE'}
              </button>
            </div>

            {totalVotes > 0 && (
              <div>
                <div className="flex gap-1 mb-1" style={{ height: '12px' }}>
                  <div style={{ width: `${agreePercent}%`, background: 'var(--neon-green)', boxShadow: '0 0 6px var(--neon-green)', transition: 'width 0.4s' }} />
                  <div style={{ width: `${disagreePercent}%`, background: 'var(--neon-pink)', boxShadow: '0 0 6px var(--neon-pink)', transition: 'width 0.4s' }} />
                </div>
                <div className="flex justify-between">
                  <span className="vt323" style={{ color: 'var(--neon-green)', fontSize: '16px' }}>
                    {agreePercent}% agree
                  </span>
                  <span className="vt323" style={{ color: 'var(--neon-pink)', fontSize: '16px' }}>
                    {disagreePercent}% disagree
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Example prompts */}
      {!verdict && (
        <div className="mt-4">
          <p style={{ fontFamily: 'Press Start 2P', fontSize: '8px', color: 'rgba(0,255,159,0.3)', letterSpacing: '2px', marginBottom: '12px' }}>
            NEED INSPIRATION? TRY:
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              'Pineapple on pizza',
              'Die Hard is a Christmas movie',
              'GIF is pronounced JIF',
              'Toilet paper: over or under',
            ].map(example => (
              <button
                key={example}
                className="vt323"
                style={{
                  padding: '6px 12px',
                  border: '1px solid rgba(0,255,159,0.2)',
                  background: 'transparent',
                  color: 'rgba(0,255,159,0.5)',
                  cursor: 'pointer',
                  fontSize: '18px',
                  transition: 'all 0.2s',
                }}
                onClick={() => setTopic(example)}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--neon-green)'
                  e.currentTarget.style.color = 'var(--neon-green)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(0,255,159,0.2)'
                  e.currentTarget.style.color = 'rgba(0,255,159,0.5)'
                }}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
