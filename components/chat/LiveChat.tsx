'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

type Message = {
  id: number
  username: string
  message: string
  created_at: string
}

const COLORS = [
  'var(--neon-green)',
  'var(--neon-cyan)',
  'var(--neon-pink)',
  'var(--neon-yellow)',
  'var(--neon-orange)',
]

function getUserColor(username: string): string {
  let hash = 0
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function LiveChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState('')
  const [usernameSet, setUsernameSet] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/chat')
      const data = await res.json()
      setMessages(data.messages || [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMessages()
    pollRef.current = setInterval(fetchMessages, 5000) // Poll every 5s
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSetUsername = () => {
    const clean = username.trim().replace(/[^a-zA-Z0-9_\- ]/g, '')
    if (clean.length < 2) {
      setError('Username must be at least 2 characters')
      return
    }
    setUsername(clean)
    setUsernameSet(true)
    setError('')
  }

  const handleSend = async () => {
    if (!message.trim() || sending) return
    setError('')
    setSending(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, message: message.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      setMessage('')
      fetchMessages()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!usernameSet) {
    return (
      <div className="max-w-md mx-auto arcade-card box-glow-green">
        <p style={{ fontFamily: 'Press Start 2P', fontSize: '11px', color: 'var(--neon-green)', marginBottom: '20px', letterSpacing: '2px' }}>
          ENTER THE PIT
        </p>
        <p className="vt323 mb-6" style={{ color: 'rgba(0,255,159,0.6)', fontSize: '20px' }}>
          Choose your callsign, pilot.
        </p>
        <input
          className="pixel-input mb-4"
          placeholder="Your username..."
          value={username}
          onChange={e => setUsername(e.target.value.slice(0, 16))}
          onKeyDown={e => e.key === 'Enter' && handleSetUsername()}
          maxLength={16}
          autoFocus
        />
        {error && <p className="vt323 mb-3" style={{ color: 'var(--neon-yellow)', fontSize: '18px' }}>⚠ {error}</p>}
        <button className="pixel-btn" style={{ width: '100%' }} onClick={handleSetUsername}>
          JOIN THE PIT
        </button>
        <p className="vt323 mt-4 text-center" style={{ color: 'rgba(0,255,159,0.3)', fontSize: '16px' }}>
          Chat auto-clears every 24 hours. Be excellent to each other.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className="arcade-card box-glow-green mb-4"
        style={{ padding: '0', overflow: 'hidden' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '2px solid var(--border-glow)', background: 'rgba(0,255,159,0.05)' }}
        >
          <div className="flex items-center gap-2">
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--neon-green)', boxShadow: '0 0 6px var(--neon-green)', display: 'inline-block' }} className="pulse-glow" />
            <span style={{ fontFamily: 'Press Start 2P', fontSize: '9px', color: 'var(--neon-green)' }}>THE PIT</span>
          </div>
          <span className="vt323" style={{ color: 'rgba(0,255,159,0.5)', fontSize: '16px' }}>
            chatting as <span style={{ color: getUserColor(username) }}>{username}</span>
          </span>
        </div>

        {/* Messages */}
        <div
          style={{
            height: '400px',
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {loading && (
            <p className="vt323 blink text-center" style={{ color: 'rgba(0,255,159,0.4)', fontSize: '20px' }}>LOADING...</p>
          )}
          {!loading && messages.length === 0 && (
            <p className="vt323 text-center" style={{ color: 'rgba(0,255,159,0.3)', fontSize: '20px', marginTop: 'auto', marginBottom: 'auto' }}>
              The pit is empty. Say something!
            </p>
          )}
          {messages.map(msg => (
            <div key={msg.id} className="flex gap-2">
              <span
                className="vt323"
                style={{ color: getUserColor(msg.username), fontSize: '18px', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {msg.username}:
              </span>
              <span className="vt323" style={{ color: '#ffffff', fontSize: '18px', wordBreak: 'break-word' }}>
                {msg.message}
              </span>
              <span className="vt323 ml-auto pl-2" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {timeAgo(msg.created_at)}
              </span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ borderTop: '2px solid var(--border-glow)', padding: '12px 16px' }}>
          {error && (
            <p className="vt323 mb-2" style={{ color: 'var(--neon-yellow)', fontSize: '16px' }}>⚠ {error}</p>
          )}
          <div className="flex gap-2">
            <input
              className="pixel-input"
              style={{ flex: 1 }}
              placeholder="Say something..."
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, 200))}
              onKeyDown={handleKeyDown}
              maxLength={200}
            />
            <button
              className="pixel-btn"
              style={{ padding: '10px 16px', fontSize: '9px', flexShrink: 0 }}
              onClick={handleSend}
              disabled={sending || !message.trim()}
            >
              {sending ? '...' : 'SEND'}
            </button>
          </div>
          <p className="vt323 mt-2" style={{ color: 'rgba(0,255,159,0.3)', fontSize: '14px' }}>
            {message.length}/200 · Enter to send · Chat clears every 24h
          </p>
        </div>
      </div>

      <button
        className="vt323"
        style={{ background: 'transparent', border: 'none', color: 'rgba(0,255,159,0.3)', cursor: 'pointer', fontSize: '16px' }}
        onClick={() => { setUsernameSet(false); setUsername('') }}
      >
        ← Change username
      </button>
    </div>
  )
}
