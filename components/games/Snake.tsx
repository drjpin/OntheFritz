'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

const GRID = 20
const CELL = 24

interface SnakeProps {
  onScoreSubmit: (score: number) => void
}

type Dir = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
type Point = { x: number; y: number }

function randomFood(snake: Point[]): Point {
  let food: Point
  do {
    food = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) }
  } while (snake.some(s => s.x === food.x && s.y === food.y))
  return food
}

export default function Snake({ onScoreSubmit }: SnakeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const stateRef = useRef<{
    snake: Point[]
    dir: Dir
    nextDir: Dir
    food: Point
    score: number
    running: boolean
    intervalId: ReturnType<typeof setInterval> | null
  } | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'dead'>('idle')
  const [displayScore, setDisplayScore] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen?.().catch(() => {})
    else document.exitFullscreen?.()
  }

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const s = stateRef.current
    if (!canvas || !ctx || !s) return
    const W = GRID * CELL
    ctx.fillStyle = '#05050f'
    ctx.fillRect(0, 0, W, W)

    ctx.fillStyle = 'rgba(0,255,159,0.05)'
    for (let x = 0; x < GRID; x++)
      for (let y = 0; y < GRID; y++)
        ctx.fillRect(x * CELL + CELL / 2 - 1, y * CELL + CELL / 2 - 1, 2, 2)

    ctx.fillStyle = '#ff006e'; ctx.shadowColor = '#ff006e'; ctx.shadowBlur = 15
    ctx.fillRect(s.food.x * CELL + 2, s.food.y * CELL + 2, CELL - 4, CELL - 4)
    ctx.shadowBlur = 0

    s.snake.forEach((seg, i) => {
      const isHead = i === 0
      const brightness = 1 - (i / s.snake.length) * 0.6
      ctx.fillStyle = isHead ? '#00ff9f' : `rgba(0, ${Math.floor(200 * brightness)}, ${Math.floor(120 * brightness)}, 1)`
      ctx.shadowColor = '#00ff9f'; ctx.shadowBlur = isHead ? 12 : 4
      ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2)
    })
    ctx.shadowBlur = 0
  }, [])

  const changeDir = useCallback((newDir: Dir) => {
    const s = stateRef.current
    if (!s) return
    const opposite: Record<Dir, Dir> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }
    if (newDir !== opposite[s.dir]) s.nextDir = newDir
  }, [])

  const startGame = useCallback(() => {
    const initSnake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }]
    stateRef.current = { snake: initSnake, dir: 'RIGHT', nextDir: 'RIGHT', food: randomFood(initSnake), score: 0, running: true, intervalId: null }
    setGameState('playing'); setDisplayScore(0)
  }, [])

  useEffect(() => {
    if (gameState !== 'playing' || !stateRef.current) return
    const s = stateRef.current

    const tick = () => {
      if (!s.running) return
      s.dir = s.nextDir
      const head = s.snake[0]
      const newHead: Point = {
        x: head.x + (s.dir === 'RIGHT' ? 1 : s.dir === 'LEFT' ? -1 : 0),
        y: head.y + (s.dir === 'DOWN' ? 1 : s.dir === 'UP' ? -1 : 0),
      }
      if (newHead.x < 0 || newHead.x >= GRID || newHead.y < 0 || newHead.y >= GRID) {
        s.running = false; setGameState('dead'); onScoreSubmit(s.score); return
      }
      if (s.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        s.running = false; setGameState('dead'); onScoreSubmit(s.score); return
      }
      s.snake.unshift(newHead)
      if (newHead.x === s.food.x && newHead.y === s.food.y) {
        s.score += 10; setDisplayScore(s.score); s.food = randomFood(s.snake)
      } else {
        s.snake.pop()
      }
      draw()
    }

    const speed = Math.max(80, 150 - Math.floor(displayScore / 50) * 10)
    s.intervalId = setInterval(tick, speed)
    draw()
    return () => { if (s.intervalId) clearInterval(s.intervalId) }
  }, [gameState, draw, onScoreSubmit, displayScore])

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = { ArrowUp: 'UP', w: 'UP', ArrowDown: 'DOWN', s: 'DOWN', ArrowLeft: 'LEFT', a: 'LEFT', ArrowRight: 'RIGHT', d: 'RIGHT' }
      const newDir = map[e.key]
      if (newDir) { changeDir(newDir); e.preventDefault() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [changeDir])

  // Touch swipe detection
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    if (!touchStartRef.current) return
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return
    if (Math.abs(dx) > Math.abs(dy)) changeDir(dx < 0 ? 'LEFT' : 'RIGHT')
    else changeDir(dy < 0 ? 'UP' : 'DOWN')
    touchStartRef.current = null
  }, [changeDir])

  const W = GRID * CELL

  const dpadBtn: React.CSSProperties = {
    fontFamily: 'Press Start 2P',
    fontSize: '16px',
    width: '60px',
    height: '60px',
    background: 'rgba(0,255,159,0.1)',
    border: '2px solid var(--neon-green)',
    color: 'var(--neon-green)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none',
    boxShadow: '0 0 6px rgba(0,255,159,0.2)',
  }

  return (
    <div
      ref={containerRef}
      style={{ background: '#05050f', padding: isFullscreen ? '16px' : '0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-8 w-full justify-between mb-2">
          <span className="vt323 text-2xl glow-green">SCORE: {displayScore}</span>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span className="vt323 text-xl" style={{ color: 'var(--neon-cyan)' }}>LENGTH: {stateRef.current?.snake.length ?? 3}</span>
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
            width={W}
            height={W}
            className="block max-w-full"
            style={{ border: '2px solid var(--neon-green)', boxShadow: '0 0 10px var(--neon-green)' }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />
          {gameState === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
              <p className="glow-green mb-2" style={{ fontFamily: 'Press Start 2P', fontSize: '14px' }}>SNAKE</p>
              <p className="vt323 text-xl text-center mb-6" style={{ color: 'var(--neon-cyan)' }}>Arrow keys, WASD, or D-pad</p>
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

        {/* D-pad */}
        <div style={{ display: 'grid', gridTemplateColumns: '60px 60px 60px', gridTemplateRows: '60px 60px 60px', gap: '6px' }}>
          <div />
          <button style={dpadBtn} onPointerDown={() => changeDir('UP')}>▲</button>
          <div />
          <button style={dpadBtn} onPointerDown={() => changeDir('LEFT')}>◀</button>
          <div style={{ background: 'rgba(0,255,159,0.04)', border: '1px solid rgba(0,255,159,0.1)', borderRadius: '4px' }} />
          <button style={dpadBtn} onPointerDown={() => changeDir('RIGHT')}>▶</button>
          <div />
          <button style={dpadBtn} onPointerDown={() => changeDir('DOWN')}>▼</button>
          <div />
        </div>
      </div>
    </div>
  )
}
