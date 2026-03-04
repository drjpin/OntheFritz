'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface BreakoutProps {
  onScoreSubmit: (score: number) => void
}

const COLS = 10
const ROWS = 5
const BRICK_COLORS = ['#ff006e', '#ff9f00', '#ffff00', '#00ffff', '#00ff9f']

export default function Breakout({ onScoreSubmit }: BreakoutProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const gameRef = useRef<{
    ball: { x: number; y: number; dx: number; dy: number; r: number }
    paddle: { x: number; w: number; h: number }
    bricks: { x: number; y: number; alive: boolean; color: string }[][]
    score: number
    lives: number
    running: boolean
    animId: number
    level: number
  } | null>(null)
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'dead' | 'won'>('idle')
  const [displayScore, setDisplayScore] = useState(0)
  const [displayLives, setDisplayLives] = useState(3)
  const keysRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false })

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen?.().catch(() => {})
    else document.exitFullscreen?.()
  }

  const getCanvas = () => canvasRef.current
  const getCtx = () => canvasRef.current?.getContext('2d')

  const initBricks = (level: number) => {
    const bricks: { x: number; y: number; alive: boolean; color: string }[][] = []
    const canvas = getCanvas()
    if (!canvas) return bricks
    const bW = (canvas.width - 40) / COLS
    const bH = 22
    for (let r = 0; r < ROWS; r++) {
      bricks[r] = []
      for (let c = 0; c < COLS; c++) {
        bricks[r][c] = {
          x: 20 + c * bW,
          y: 50 + r * (bH + 4),
          alive: true,
          color: BRICK_COLORS[r % BRICK_COLORS.length],
        }
      }
    }
    return bricks
  }

  const startGame = useCallback(() => {
    const canvas = getCanvas()
    if (!canvas) return
    const W = canvas.width
    const H = canvas.height
    const speed = 4
    gameRef.current = {
      ball: { x: W / 2, y: H - 80, dx: speed, dy: -speed, r: 7 },
      paddle: { x: W / 2 - 50, w: 100, h: 12 },
      bricks: initBricks(1),
      score: 0,
      lives: 3,
      running: true,
      animId: 0,
      level: 1,
    }
    setGameState('playing')
    setDisplayScore(0)
    setDisplayLives(3)
  }, [])

  useEffect(() => {
    if (gameState !== 'playing') return
    const canvas = getCanvas()
    const ctx = getCtx()
    if (!canvas || !ctx || !gameRef.current) return
    const W = canvas.width
    const H = canvas.height
    const g = gameRef.current

    const draw = () => {
      if (!g.running) return

      // Move paddle
      const paddleSpeed = 7
      if (keysRef.current.left && g.paddle.x > 0) g.paddle.x -= paddleSpeed
      if (keysRef.current.right && g.paddle.x + g.paddle.w < W) g.paddle.x += paddleSpeed

      // Move ball
      g.ball.x += g.ball.dx
      g.ball.y += g.ball.dy

      // Wall collisions
      if (g.ball.x - g.ball.r < 0) { g.ball.x = g.ball.r; g.ball.dx *= -1 }
      if (g.ball.x + g.ball.r > W) { g.ball.x = W - g.ball.r; g.ball.dx *= -1 }
      if (g.ball.y - g.ball.r < 0) { g.ball.y = g.ball.r; g.ball.dy *= -1 }

      // Paddle collision
      if (
        g.ball.y + g.ball.r >= H - 40 &&
        g.ball.y + g.ball.r <= H - 40 + g.paddle.h &&
        g.ball.x >= g.paddle.x &&
        g.ball.x <= g.paddle.x + g.paddle.w
      ) {
        g.ball.dy = -Math.abs(g.ball.dy)
        const hitPos = (g.ball.x - g.paddle.x) / g.paddle.w - 0.5
        g.ball.dx = hitPos * 8
      }

      // Bottom — lose life
      if (g.ball.y - g.ball.r > H) {
        g.lives--
        setDisplayLives(g.lives)
        if (g.lives <= 0) {
          g.running = false
          setGameState('dead')
          onScoreSubmit(g.score)
          return
        }
        g.ball = { x: W / 2, y: H - 80, dx: 4, dy: -4, r: 7 }
        g.paddle.x = W / 2 - 50
      }

      // Brick collisions
      const bW = (W - 40) / COLS
      const bH = 22
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const b = g.bricks[r][c]
          if (!b.alive) continue
          if (
            g.ball.x > b.x && g.ball.x < b.x + bW - 2 &&
            g.ball.y - g.ball.r < b.y + bH && g.ball.y + g.ball.r > b.y
          ) {
            b.alive = false
            g.ball.dy *= -1
            g.score += 10 * (g.level)
            setDisplayScore(g.score)
          }
        }
      }

      // Check win
      const allDead = g.bricks.every(row => row.every(b => !b.alive))
      if (allDead) {
        g.level++
        g.bricks = initBricks(g.level)
        const speed = 4 + g.level * 0.5
        g.ball = { x: W / 2, y: H - 80, dx: speed, dy: -speed, r: 7 }
      }

      // Clear
      ctx.fillStyle = '#05050f'
      ctx.fillRect(0, 0, W, H)

      // Draw bricks
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const b = g.bricks[r][c]
          if (!b.alive) continue
          ctx.fillStyle = b.color
          ctx.shadowColor = b.color
          ctx.shadowBlur = 8
          ctx.fillRect(b.x + 1, b.y + 1, bW - 4, bH - 2)
          ctx.shadowBlur = 0
        }
      }

      // Draw paddle
      ctx.fillStyle = '#00ff9f'
      ctx.shadowColor = '#00ff9f'
      ctx.shadowBlur = 12
      ctx.fillRect(g.paddle.x, H - 40, g.paddle.w, g.paddle.h)
      ctx.shadowBlur = 0

      // Draw ball
      ctx.beginPath()
      ctx.arc(g.ball.x, g.ball.y, g.ball.r, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = '#ffffff'
      ctx.shadowBlur = 10
      ctx.fill()
      ctx.shadowBlur = 0

      g.animId = requestAnimationFrame(draw)
    }

    g.animId = requestAnimationFrame(draw)
    return () => { if (g.animId) cancelAnimationFrame(g.animId) }
  }, [gameState, onScoreSubmit])

  // Keyboard controls
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.left = true
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.right = true
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') keysRef.current.left = false
      if (e.key === 'ArrowRight' || e.key === 'd') keysRef.current.right = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  // Mouse/touch control
  const movePaddleTo = useCallback((clientX: number) => {
    if (!gameRef.current || gameState !== 'playing') return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const relX = (clientX - rect.left) * scaleX
    gameRef.current.paddle.x = Math.max(0, Math.min(canvas.width - gameRef.current.paddle.w, relX - gameRef.current.paddle.w / 2))
  }, [gameState])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    movePaddleTo(e.clientX)
  }, [movePaddleTo])

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    movePaddleTo(e.touches[0].clientX)
  }, [movePaddleTo])

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    movePaddleTo(e.touches[0].clientX)
  }, [movePaddleTo])

  return (
    <div
      ref={containerRef}
      style={{ background: '#05050f', padding: isFullscreen ? '16px' : '0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <div className="flex flex-col items-center gap-4">
      <div className="flex gap-8 w-full justify-between mb-2">
        <span className="vt323 text-2xl glow-green">SCORE: {displayScore}</span>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span className="vt323 text-2xl glow-pink">{'♥ '.repeat(displayLives)}</span>
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(0,255,159,0.3)', color: 'rgba(0,255,159,0.7)', cursor: 'pointer', fontSize: '14px', padding: '2px 6px' }}
          >
            {isFullscreen ? '⊠' : '⛶'}
          </button>
        </div>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={480}
          height={520}
          className="border-2 border-neon-green box-glow-green block max-w-full"
          style={{ borderColor: 'var(--neon-green)', cursor: 'none', touchAction: 'none' }}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          onTouchStart={handleTouchStart}
        />
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="glow-green text-sm mb-2 text-center px-4" style={{ fontFamily: 'Press Start 2P', fontSize: '14px' }}>BREAKOUT</p>
            <p className="vt323 text-xl text-center mb-6" style={{ color: 'var(--neon-cyan)' }}>Move mouse or use ← → keys</p>
            <button className="pixel-btn" onClick={startGame}>INSERT COIN</button>
          </div>
        )}
        {gameState === 'dead' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="glow-pink mb-2" style={{ fontFamily: 'Press Start 2P', fontSize: '14px' }}>GAME OVER</p>
            <p className="vt323 text-2xl mb-6" style={{ color: 'var(--neon-yellow)' }}>Score: {displayScore}</p>
            <button className="pixel-btn" onClick={startGame}>PLAY AGAIN</button>
          </div>
        )}
      </div>
      <p className="vt323 text-center" style={{ color: 'rgba(0,255,159,0.4)', fontSize: '16px' }}>
        Touch/drag the game or use ← → arrow keys
      </p>
    </div>
    </div>
  )
}
