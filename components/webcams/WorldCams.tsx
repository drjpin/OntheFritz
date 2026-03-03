'use client'

import { useState } from 'react'

const CAMS = [
  { name: 'Times Square, NYC', url: 'https://www.youtube.com/embed/oJEDPINfqkk?autoplay=1&mute=1', location: 'New York, USA', emoji: '🗽' },
  { name: 'Tokyo Shibuya Crossing', url: 'https://www.youtube.com/embed/d-MGkKDOFjQ?autoplay=1&mute=1', location: 'Tokyo, Japan', emoji: '🗼' },
  { name: 'Niagara Falls', url: 'https://www.youtube.com/embed/0Q3_FGKrVHQ?autoplay=1&mute=1', location: 'Ontario, Canada', emoji: '🌊' },
  { name: 'Eiffel Tower', url: 'https://www.youtube.com/embed/IjLzbGzxJhQ?autoplay=1&mute=1', location: 'Paris, France', emoji: '🗼' },
  { name: 'Northern Lights', url: 'https://www.youtube.com/embed/DQoKFbamFOQ?autoplay=1&mute=1', location: 'Iceland', emoji: '🌌' },
  { name: 'Sydney Harbour', url: 'https://www.youtube.com/embed/BNt_oAv0YVg?autoplay=1&mute=1', location: 'Sydney, Australia', emoji: '🦘' },
  { name: 'African Waterhole', url: 'https://www.youtube.com/embed/ydYDqZQpim8?autoplay=1&mute=1', location: 'Kruger Park, South Africa', emoji: '🦁' },
  { name: 'International Space Station', url: 'https://www.youtube.com/embed/P9C25Un7xaM?autoplay=1&mute=1', location: 'Low Earth Orbit', emoji: '🚀' },
]

export default function WorldCams() {
  const [activeCam, setActiveCam] = useState(0)
  const [loaded, setLoaded] = useState(false)

  const cam = CAMS[activeCam]

  const randomCam = () => {
    const idx = Math.floor(Math.random() * CAMS.length)
    setActiveCam(idx)
    setLoaded(false)
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Current cam display */}
      <div className="arcade-card box-glow-cyan mb-6" style={{ borderColor: 'var(--neon-cyan)', padding: '0', overflow: 'hidden' }}>
        <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
          <iframe
            key={activeCam}
            src={cam.url}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            allow="autoplay; encrypted-media"
            allowFullScreen
            onLoad={() => setLoaded(true)}
          />
          {!loaded && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)' }}>
              <p className="vt323 blink glow-cyan" style={{ fontSize: '24px' }}>CONNECTING TO FEED...</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between p-4" style={{ background: 'var(--bg-card)' }}>
          <div>
            <p style={{ fontFamily: 'Press Start 2P', fontSize: '10px', color: 'var(--neon-cyan)', marginBottom: '4px' }}>
              {cam.emoji} {cam.name}
            </p>
            <p className="vt323" style={{ color: 'rgba(0,255,255,0.5)', fontSize: '18px' }}>{cam.location}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--neon-pink)', boxShadow: '0 0 6px var(--neon-pink)', display: 'inline-block' }} className="pulse-glow" />
            <span className="vt323" style={{ color: 'var(--neon-pink)', fontSize: '18px' }}>LIVE</span>
          </div>
        </div>
      </div>

      {/* Random button */}
      <div className="flex justify-center mb-6">
        <button className="pixel-btn pixel-btn-cyan" style={{ fontSize: '11px' }} onClick={randomCam}>
          🎲 RANDOM CAM
        </button>
      </div>

      {/* Cam grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CAMS.map((c, i) => (
          <button
            key={i}
            onClick={() => { setActiveCam(i); setLoaded(false) }}
            className="arcade-card"
            style={{
              padding: '12px',
              border: `2px solid ${activeCam === i ? 'var(--neon-cyan)' : 'var(--border-glow)'}`,
              boxShadow: activeCam === i ? '0 0 10px var(--neon-cyan)' : 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
              background: activeCam === i ? 'rgba(0,255,255,0.05)' : 'var(--bg-card)',
            }}
          >
            <p style={{ fontSize: '20px', marginBottom: '4px' }}>{c.emoji}</p>
            <p style={{ fontFamily: 'Press Start 2P', fontSize: '7px', color: activeCam === i ? 'var(--neon-cyan)' : 'rgba(0,255,255,0.5)', lineHeight: '1.4' }}>
              {c.name}
            </p>
          </button>
        ))}
      </div>

      <p className="vt323 text-center mt-6" style={{ color: 'rgba(0,255,255,0.3)', fontSize: '16px' }}>
        * Live feeds via YouTube. Some streams may go offline occasionally.
      </p>
    </div>
  )
}
