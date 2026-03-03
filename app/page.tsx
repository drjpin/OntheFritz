'use client'

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'

const Breakout = dynamic(() => import('@/components/games/Breakout'), { ssr: false })
const Snake = dynamic(() => import('@/components/games/Snake'), { ssr: false })
const Trism = dynamic(() => import('@/components/games/Trism'), { ssr: false })
const ArgumentDecider = dynamic(() => import('@/components/decider/ArgumentDecider'), { ssr: false })
const WorldCams = dynamic(() => import('@/components/webcams/WorldCams'), { ssr: false })
const LiveChat = dynamic(() => import('@/components/chat/LiveChat'), { ssr: false })
const Leaderboard = dynamic(() => import('@/components/leaderboard/Leaderboard'), { ssr: false })

type Section = 'home' | 'arcade' | 'decider' | 'cams' | 'pit'
type GameTab = 'breakout' | 'snake' | 'trism'

const NAV_ITEMS: { id: Section; label: string; emoji: string }[] = [
  { id: 'home', label: 'HOME', emoji: '📺' },
  { id: 'arcade', label: 'ARCADE', emoji: '🕹️' },
  { id: 'decider', label: 'THE DECIDER', emoji: '⚖️' },
  { id: 'cams', label: 'WORLD CAMS', emoji: '🌍' },
  { id: 'pit', label: 'THE PIT', emoji: '💬' },
]

export default function Home() {
  const [section, setSection] = useState<Section>('home')
  const [gameTab, setGameTab] = useState<GameTab>('breakout')
  const [pendingScore, setPendingScore] = useState<{ game: string; score: number } | null>(null)

  const handleScoreSubmit = useCallback((game: string) => (score: number) => {
    if (score > 0) {
      setPendingScore({ game, score })
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* AdSense top banner placeholder */}
      <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border-glow)', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Google AdSense banner goes here */}
        <span className="vt323" style={{ color: 'rgba(0,255,159,0.15)', fontSize: '14px' }}>ADVERTISEMENT</span>
      </div>

      {/* Header */}
      <header style={{ padding: '24px 24px 0', textAlign: 'center' }}>
        <div style={{ marginBottom: '8px' }}>
          <span
            className="glow-pink glitch"
            data-text="ON THE FRITZ"
            style={{ fontFamily: 'Press Start 2P', fontSize: 'clamp(20px, 5vw, 40px)', letterSpacing: '6px', cursor: 'default' }}
          >
            ON THE FRITZ
          </span>
        </div>
        <p className="vt323" style={{ color: 'rgba(0,255,159,0.6)', fontSize: 'clamp(16px, 3vw, 22px)', letterSpacing: '2px' }}>
          Your productivity is about to be On The Fritz
        </p>

        {/* Buy Me a Coffee */}
        <div style={{ marginTop: '12px' }}>
          <a
            href="https://buymeacoffee.com"
            target="_blank"
            rel="noopener noreferrer"
            className="vt323"
            style={{
              color: 'rgba(255,159,0,0.5)',
              fontSize: '16px',
              textDecoration: 'none',
              padding: '4px 10px',
              border: '1px solid rgba(255,159,0,0.2)',
              transition: 'all 0.2s',
              display: 'inline-block',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = 'var(--neon-orange)'
              e.currentTarget.style.borderColor = 'var(--neon-orange)'
              e.currentTarget.style.boxShadow = '0 0 8px var(--neon-orange)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = 'rgba(255,159,0,0.5)'
              e.currentTarget.style.borderColor = 'rgba(255,159,0,0.2)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            ☕ Buy me a coffee
          </a>
        </div>
      </header>

      {/* Nav */}
      <nav style={{ padding: '16px 24px', display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', borderBottom: '1px solid var(--border-glow)' }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setSection(item.id)}
            style={{
              fontFamily: 'Press Start 2P',
              fontSize: '8px',
              padding: '10px 14px',
              border: `1px solid ${section === item.id ? 'var(--neon-green)' : 'transparent'}`,
              background: section === item.id ? 'rgba(0,255,159,0.08)' : 'transparent',
              color: section === item.id ? 'var(--neon-green)' : 'rgba(0,255,159,0.5)',
              cursor: 'pointer',
              boxShadow: section === item.id ? '0 0 10px rgba(0,255,159,0.3)' : 'none',
              transition: 'all 0.2s',
              letterSpacing: '2px',
            }}
          >
            {item.emoji} {item.label}
          </button>
        ))}
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, padding: '32px 24px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>

        {/* ===== HOME ===== */}
        {section === 'home' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <p className="vt323" style={{ fontSize: 'clamp(18px, 3vw, 28px)', color: 'rgba(0,255,159,0.7)', maxWidth: '600px', margin: '0 auto', lineHeight: '1.5' }}>
                Welcome to the internet&apos;s finest waste of time. Productivity is overrated anyway.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {[
                { id: 'arcade' as Section, emoji: '🕹️', title: 'ARCADE', color: 'var(--neon-green)', desc: 'Classic games. Breakout. Snake. Trism. High scores. Glory.' },
                { id: 'decider' as Section, emoji: '⚖️', title: 'THE DECIDER', color: 'var(--neon-pink)', desc: 'Submit an argument. Get a ruthless verdict. Settle it forever.' },
                { id: 'cams' as Section, emoji: '🌍', title: 'WORLD CAMS', color: 'var(--neon-cyan)', desc: 'Peek at live feeds from around the planet. Just vibes.' },
                { id: 'pit' as Section, emoji: '💬', title: 'THE PIT', color: 'var(--neon-yellow)', desc: 'Live chat. Clears every 24 hours. No receipts.' },
              ].map(card => (
                <button
                  key={card.id}
                  onClick={() => setSection(card.id)}
                  className="arcade-card"
                  style={{
                    border: `2px solid ${card.color}`,
                    boxShadow: `0 0 8px ${card.color}30`,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    padding: '28px',
                    width: '100%',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = `0 0 20px ${card.color}60`
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = `0 0 8px ${card.color}30`
                    e.currentTarget.style.transform = 'none'
                  }}
                >
                  <p style={{ fontSize: '32px', marginBottom: '12px' }}>{card.emoji}</p>
                  <p style={{ fontFamily: 'Press Start 2P', fontSize: '13px', color: card.color, marginBottom: '12px', letterSpacing: '2px' }}>
                    {card.title}
                  </p>
                  <p className="vt323" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '20px', lineHeight: '1.4' }}>
                    {card.desc}
                  </p>
                </button>
              ))}
            </div>

            {/* Bottom ad placeholder */}
            <div style={{ textAlign: 'center', padding: '16px', border: '1px dashed rgba(0,255,159,0.1)', marginTop: '24px', minHeight: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="vt323" style={{ color: 'rgba(0,255,159,0.1)', fontSize: '14px' }}>ADVERTISEMENT</span>
            </div>
          </div>
        )}

        {/* ===== ARCADE ===== */}
        {section === 'arcade' && (
          <div>
            <h2 className="section-header glow-green" style={{ borderColor: 'var(--neon-green)' }}>
              🕹️ ARCADE
            </h2>

            {/* Game tabs */}
            <div className="flex gap-3 mb-8 flex-wrap">
              {(['breakout', 'snake', 'trism'] as GameTab[]).map(g => (
                <button
                  key={g}
                  onClick={() => setGameTab(g)}
                  style={{
                    fontFamily: 'Press Start 2P',
                    fontSize: '9px',
                    padding: '10px 16px',
                    border: `2px solid ${gameTab === g ? 'var(--neon-green)' : 'var(--border-glow)'}`,
                    background: gameTab === g ? 'rgba(0,255,159,0.1)' : 'transparent',
                    color: gameTab === g ? 'var(--neon-green)' : 'rgba(0,255,159,0.4)',
                    cursor: 'pointer',
                    boxShadow: gameTab === g ? '0 0 12px rgba(0,255,159,0.4)' : 'none',
                    letterSpacing: '2px',
                  }}
                >
                  {g.toUpperCase()}
                </button>
              ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Game area */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {gameTab === 'breakout' && (
                  <Breakout onScoreSubmit={handleScoreSubmit('breakout')} />
                )}
                {gameTab === 'snake' && (
                  <Snake onScoreSubmit={handleScoreSubmit('snake')} />
                )}
                {gameTab === 'trism' && (
                  <Trism onScoreSubmit={handleScoreSubmit('trism')} />
                )}
              </div>

              {/* Leaderboard sidebar */}
              <div style={{ flexShrink: 0 }}>
                <Leaderboard
                  activeGame={gameTab}
                  pendingScore={pendingScore?.game === gameTab ? pendingScore : null}
                  onScoreSubmitted={() => setPendingScore(null)}
                />
              </div>
            </div>
          </div>
        )}

        {/* ===== DECIDER ===== */}
        {section === 'decider' && (
          <div>
            <h2 className="section-header glow-pink" style={{ borderColor: 'var(--neon-pink)' }}>
              ⚖️ THE DECIDER
            </h2>
            <p className="vt323 mb-8 text-center" style={{ color: 'rgba(255,0,110,0.6)', fontSize: '22px' }}>
              Can&apos;t settle an argument? Let the AI decide. It will not be kind.
            </p>

            {/* Ad slot */}
            <div style={{ textAlign: 'center', marginBottom: '24px', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(255,0,110,0.1)' }}>
              <span className="vt323" style={{ color: 'rgba(255,0,110,0.1)', fontSize: '14px' }}>ADVERTISEMENT</span>
            </div>

            <ArgumentDecider />
          </div>
        )}

        {/* ===== WORLD CAMS ===== */}
        {section === 'cams' && (
          <div>
            <h2 className="section-header glow-cyan" style={{ borderColor: 'var(--neon-cyan)' }}>
              🌍 WORLD CAMS
            </h2>
            <p className="vt323 mb-8 text-center" style={{ color: 'rgba(0,255,255,0.6)', fontSize: '22px' }}>
              Live feeds from around the planet. You&apos;re everywhere at once.
            </p>
            <WorldCams />
          </div>
        )}

        {/* ===== THE PIT ===== */}
        {section === 'pit' && (
          <div>
            <h2 className="section-header glow-yellow" style={{ borderColor: 'var(--neon-yellow)' }}>
              💬 THE PIT
            </h2>
            <p className="vt323 mb-8 text-center" style={{ color: 'rgba(255,255,0,0.6)', fontSize: '22px' }}>
              Say what&apos;s on your mind. It disappears in 24 hours. No receipts.
            </p>
            <LiveChat />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ padding: '24px', borderTop: '1px solid var(--border-glow)', textAlign: 'center' }}>
        {/* Footer ad */}
        <div style={{ minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '1px dashed rgba(0,255,159,0.08)' }}>
          <span className="vt323" style={{ color: 'rgba(0,255,159,0.1)', fontSize: '14px' }}>ADVERTISEMENT</span>
        </div>
        <p className="vt323" style={{ color: 'rgba(0,255,159,0.3)', fontSize: '16px', marginBottom: '8px' }}>
          onthefritz.us — wasting your time since 2025
        </p>
        <p className="vt323" style={{ color: 'rgba(0,255,159,0.15)', fontSize: '14px' }}>
          Made with ☕ and zero productivity
        </p>
      </footer>
    </div>
  )
}
