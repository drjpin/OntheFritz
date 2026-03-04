'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface Message {
  id: string
  username: string
  text: string
  created_at: string
}

const SECTION_TAGS: Record<string, string> = {
  home: '🏠',
  arcade: '🕹️',
  decider: '⚖️',
  cams: '🌍',
  pit: '💬',
}

function hashColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  const colors = ['#00ff9f', '#ff006e', '#00ffff', '#ffff00', '#ff8800', '#aa00ff', '#ff69b4']
  return colors[Math.abs(h) % colors.length]
}

export default function FloatingChat({ section }: { section: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [username, setUsername] = useState('')
  const [nickInput, setNickInput] = useState('')
  const [text, setText] = useState('')
  const [unread, setUnread] = useState(0)
  const [sending, setSending] = useState(false)
  const [online] = useState(Math.floor(Math.random() * 12) + 2) // flavor
  const endRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(0)
  const isOpenRef = useRef(false)

  useEffect(() => { isOpenRef.current = isOpen }, [isOpen])

  // Load saved nickname
  useEffect(() => {
    const saved = localStorage.getItem('otf_pit_nick')
    if (saved) setUsername(saved)
  }, [])

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/chat')
      if (!res.ok) return
      const data: Message[] = await res.json()
      setMessages(data)
      if (data.length > prevCountRef.current && !isOpenRef.current) {
        setUnread(u => u + (data.length - prevCountRef.current))
      }
      prevCountRef.current = data.length
    } catch { /* silently fail */ }
  }, [])

  useEffect(() => {
    fetchMessages()
    const id = setInterval(fetchMessages, 5000)
    return () => clearInterval(id)
  }, [fetchMessages])

  useEffect(() => {
    if (isOpen) {
      setUnread(0)
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }, [isOpen, messages.length])

  const send = async () => {
    if (!text.trim() || !username || sending) return
    setSending(true)
    const tag = SECTION_TAGS[section] || ''
    const displayName = tag ? `${username} ${tag}` : username
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: displayName, text: text.trim() }),
      })
      setText('')
      fetchMessages()
    } catch { /* silently fail */ }
    setSending(false)
  }

  const saveNick = () => {
    const nick = nickInput.trim().slice(0, 18)
    if (!nick) return
    localStorage.setItem('otf_pit_nick', nick)
    setUsername(nick)
  }

  return (
    <>
      {/* Toggle bubble */}
      <button
        onClick={() => { setIsOpen(o => !o); setUnread(0) }}
        title="The Pit — Live Chat"
        style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000,
          width: '54px', height: '54px', borderRadius: '50%',
          background: 'var(--bg-card)', border: '2px solid var(--neon-yellow)',
          color: isOpen ? 'rgba(255,255,0,0.6)' : 'var(--neon-yellow)',
          cursor: 'pointer', fontSize: '22px',
          boxShadow: '0 0 18px rgba(255,255,0,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}
      >
        {isOpen ? '✕' : '💬'}
        {!isOpen && unread > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: 'var(--neon-pink)', color: '#fff',
            fontFamily: 'Press Start 2P', fontSize: '9px',
            minWidth: '20px', height: '20px', borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '90px', right: '24px', zIndex: 1000,
          width: '300px',
          background: 'var(--bg-card)', border: '2px solid var(--neon-yellow)',
          boxShadow: '0 0 24px rgba(255,255,0,0.15)',
          display: 'flex', flexDirection: 'column',
          maxHeight: 'calc(100vh - 120px)',
        }}>
          {/* Header */}
          <div style={{
            padding: '8px 12px', borderBottom: '1px solid rgba(255,255,0,0.2)',
            display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--neon-pink)', boxShadow: '0 0 6px var(--neon-pink)', flexShrink: 0 }} className="pulse-glow" />
            <span style={{ fontFamily: 'Press Start 2P', fontSize: '8px', color: 'var(--neon-yellow)' }}>THE PIT</span>
            <span className="vt323" style={{ fontSize: '14px', color: 'rgba(255,255,0,0.35)', marginLeft: 'auto' }}>
              {online} online
            </span>
          </div>

          {!username ? (
            /* Nickname setup */
            <div style={{ padding: '20px 14px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
              <p className="vt323" style={{ color: 'rgba(255,255,0,0.8)', fontSize: '20px', textAlign: 'center', lineHeight: 1.3 }}>
                Pick a nickname<br />to join the chat
              </p>
              <input
                className="pixel-input"
                placeholder="NICKNAME"
                value={nickInput}
                onChange={e => setNickInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveNick()}
                maxLength={18}
                autoFocus
                style={{ width: '100%', fontSize: '13px' }}
              />
              <button
                className="pixel-btn"
                style={{ fontSize: '9px', padding: '8px 14px', borderColor: 'var(--neon-yellow)', color: 'var(--neon-yellow)' }}
                onClick={saveNick}
              >
                ENTER THE PIT
              </button>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div style={{
                flex: 1, overflowY: 'auto', padding: '8px 12px',
                display: 'flex', flexDirection: 'column', gap: '4px',
                minHeight: '180px', maxHeight: '320px',
              }}>
                {messages.length === 0 ? (
                  <p className="vt323" style={{ color: 'rgba(255,255,0,0.25)', fontSize: '17px', textAlign: 'center', marginTop: '24px' }}>
                    No one&apos;s here yet.<br />Be the first to speak.
                  </p>
                ) : messages.map(msg => (
                  <div key={msg.id} style={{ lineHeight: 1.3 }}>
                    <span className="vt323" style={{ color: hashColor(msg.username), fontSize: '13px', fontWeight: 'bold' }}>
                      {msg.username}:{' '}
                    </span>
                    <span className="vt323" style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
                      {msg.text}
                    </span>
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              {/* Sender tag indicator */}
              {SECTION_TAGS[section] && (
                <div style={{ padding: '2px 12px', borderTop: '1px solid rgba(255,255,0,0.1)' }}>
                  <span className="vt323" style={{ color: 'rgba(255,255,0,0.3)', fontSize: '13px' }}>
                    chatting as {username} {SECTION_TAGS[section]}
                  </span>
                </div>
              )}

              {/* Input row */}
              <div style={{
                padding: '8px', borderTop: '1px solid rgba(255,255,0,0.2)',
                display: 'flex', gap: '6px', flexShrink: 0,
              }}>
                <input
                  className="pixel-input"
                  placeholder="say something..."
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}
                  maxLength={200}
                  style={{ flex: 1, fontSize: '12px', padding: '6px 8px', borderColor: 'rgba(255,255,0,0.4)', color: 'rgba(255,255,0,0.9)' }}
                />
                <button
                  onClick={send}
                  disabled={sending || !text.trim()}
                  style={{
                    fontFamily: 'Press Start 2P', fontSize: '10px', padding: '6px 10px',
                    background: 'rgba(255,255,0,0.08)', border: '1px solid var(--neon-yellow)',
                    color: 'var(--neon-yellow)', cursor: 'pointer',
                    opacity: (sending || !text.trim()) ? 0.35 : 1,
                  }}
                >
                  {sending ? '…' : '→'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
