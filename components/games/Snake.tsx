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
  const stateRef = useRef<{
    snake: Point[]
    dir: Dir
    nextDir: Dir
    food: Point
    score: number
    running: boolean
    intervalId: ReturnType<typeof setInterval> | null
  } | null>(null)
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'dead'>('idle')
  const [displayScore, setDisplayScore] = useState(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const s = stateRef.current
    if (!canvas || !ctx || !s) return

    const W = GRID * CELL
    ctx.fillStyle = '#05050f'
    ctx.fillRect(0, 0, W, W)

    // Grid dots
    ctx.fillStyle = 'rgba(0,255,159,0.05)'
    for (let x = 0; x < GRID; x++) {
      for (let y = 0; y < GRID; y++) {
        ctx.fillRect(x * CELL + CELL / 2 - 1, y * CELL + CELL / 2 - 1, 2, 2)
      }
    }

    // Food
    ctx.fillStyle = '#ff006e'
    ctx.shadowColor = '#ff006e'
    ctx.shadowBlur = 15
    const fx = s.food.x * CELL + 2
    const fy = s.food.y * CELL + 2
    ctx.fillRect(fx, fy, CELL - 4, CELL - 4)
    ctx.shadowBlur = 0

    // Snake
    s.snake.forEach((seg, i) => {
      const isHead = i === 0
      const brightness = 1 - (i / s.snake.length) * 0.6
      ctx.fillStyle = isHead ? '#00ff9f' : `rgba(0, ${Math.floor(200 * brightness)}, ${Math.floor(120 * brightness)}, 1)`
      ctx.shadowColor = '#00ff9f'
      ctx.shadowBlur = isHead ? 12 : 4
      ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2)
    })
    ctx.shadowBlur = 0
  }, [])

  const startGame = useCallback(() => {
    const initSnake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ]
    stateRef.current = {
      snake: initSnake,
      dir: 'RIGHT',
      nextDir: 'RIGHT',
      food: randomFood(initSnake),
      score: 0,
      running: true,
      intervalId: null,
    }
    setGameState('playing')
    setDisplayScore(0)
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

      // Wall collision
      if (newHead.x < 0 || newHead.x >= GRID || newHead.y < 0 || newHead.y >= GRID) {
        s.running = false
        setGameState('dead')
        onScoreSubmit(s.score)
        return
      }

      // Self collision
      if (s.snake.some(seg => seg.x === newHead.x && seg.y === newHead.y)) {
        s.running = false
        setGameState('dead')
        onScoreSubmit(s.score)
        return
      }

      s.snake.unshift(newHead)

      // Eat food
      if (newHead.x === s.food.x && newHead.y === s.food.y) {
        s.score += 10
        setDisplayScore(s.score)
        s.food = randomFood(s.snake)
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

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const s = stateRef.current
      if (!s) return
      const map: Record<string, Dir> = {
        ArrowUp: 'UP', w: 'UP',
        ArrowDown: 'DOWN', s: 'DOWN',
        ArrowLeft: 'LEFT', a: 'LEFT',
        ArrowRight: 'RIGHT', d: 'RIGHT',
      }
      const newDir = map[e.key]
      if (!newDir) return
      const opposite: Record<Dir, Dir> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' }
      if (newDir !== opposite[s.dir]) s.nextDir = newDir
      e.preventDefault()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const W = GRID * CELL

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-8 w-full justify-between mb-2">
        <span className="vt323 text-2xl glow-green">SCORE: {displayScore}</span>
        <span className="vt323 text-xl" style={{ color: 'var(--neon-cyan)' }}>LENGTH: {stateRef.current?.snake.length ?? 3}</span>
      </div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={W}
          height={W}
          className="block max-w-full"
          style={{ border: '2px solid var(--neon-green)', boxShadow: '0 0 10px var(--neon-green)' }}
        />
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
            <p className="glow-green mb-2" style={{ fontFamily: 'Press Start 2P', fontSize: '14px' }}>SNAKE</p>
            <p className="vt323 text-xl text-center mb-6" style={{ color: 'var(--neon-cyan)' }}>Use arrow keys or WASD</p>
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
        Arrow keys or WASD to move
      </p>
    </div>
  )
}
