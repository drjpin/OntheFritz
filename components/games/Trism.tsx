'use client'

import { useState, useCallback, useEffect } from 'react'

interface TrismProps {
  onScoreSubmit: (score: number) => void
}

const COLORS = ['#ff006e', '#00ffff', '#ffff00', '#00ff9f', '#ff9f00']
const COLOR_NAMES = ['PINK', 'CYAN', 'YELLOW', 'GREEN', 'ORANGE']
const GRID_SIZE = 7

type Cell = { color: number; selected: boolean } | null

function makeGrid(): Cell[][] {
  const grid: Cell[][] = []
  for (let r = 0; r < GRID_SIZE; r++) {
    grid[r] = []
    for (let c = 0; c < GRID_SIZE; c++) {
      grid[r][c] = { color: Math.floor(Math.random() * COLORS.length), selected: false }
    }
  }
  return grid
}

function findMatches(grid: Cell[][]): Set<string> {
  const matched = new Set<string>()

  // Horizontal matches (3+)
  for (let r = 0; r < GRID_SIZE; r++) {
    let run = 1
    for (let c = 1; c < GRID_SIZE; c++) {
      const cur = grid[r][c]
      const prev = grid[r][c - 1]
      if (cur && prev && cur.color === prev.color) {
        run++
      } else {
        if (run >= 3) {
          for (let k = c - run; k < c; k++) matched.add(`${r},${k}`)
        }
        run = 1
      }
    }
    if (run >= 3) {
      for (let k = GRID_SIZE - run; k < GRID_SIZE; k++) matched.add(`${r},${k}`)
    }
  }

  // Vertical matches (3+)
  for (let c = 0; c < GRID_SIZE; c++) {
    let run = 1
    for (let r = 1; r < GRID_SIZE; r++) {
      const cur = grid[r][c]
      const prev = grid[r - 1][c]
      if (cur && prev && cur.color === prev.color) {
        run++
      } else {
        if (run >= 3) {
          for (let k = r - run; k < r; k++) matched.add(`${k},${c}`)
        }
        run = 1
      }
    }
    if (run >= 3) {
      for (let k = GRID_SIZE - run; k < GRID_SIZE; k++) matched.add(`${k},${c}`)
    }
  }

  return matched
}

function slideRow(grid: Cell[][], row: number, dir: 'left' | 'right'): Cell[][] {
  const newGrid = grid.map(r => [...r])
  const r = newGrid[row]
  if (dir === 'left') {
    const first = r.shift()!
    r.push(first)
  } else {
    const last = r.pop()!
    r.unshift(last)
  }
  return newGrid
}

function slideCol(grid: Cell[][], col: number, dir: 'up' | 'down'): Cell[][] {
  const newGrid = grid.map(r => [...r])
  if (dir === 'up') {
    const first = newGrid.shift()!
    newGrid.push(first)
    // Only shift the column
    const colData = grid.map(r => r[col])
    const f = colData.shift()!
    colData.push(f)
    colData.forEach((cell, r) => { newGrid[r][col] = cell })
  } else {
    const colData = grid.map(r => r[col])
    const l = colData.pop()!
    colData.unshift(l)
    colData.forEach((cell, r) => { newGrid[r][col] = cell })
  }
  return newGrid
}

export default function Trism({ onScoreSubmit }: TrismProps) {
  const [grid, setGrid] = useState<Cell[][]>(() => makeGrid())
  const [score, setScore] = useState(0)
  const [moves, setMoves] = useState(30)
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'dead'>('idle')
  const [flash, setFlash] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState('')

  const startGame = useCallback(() => {
    setGrid(makeGrid())
    setScore(0)
    setMoves(30)
    setGameState('playing')
    setFlash(new Set())
    setMessage('')
  }, [])

  const processMatches = useCallback((g: Cell[][], currentScore: number): { grid: Cell[][], score: number } => {
    const matched = findMatches(g)
    if (matched.size === 0) return { grid: g, score: currentScore }

    setFlash(matched)
    setTimeout(() => setFlash(new Set()), 300)

    const pts = matched.size * 10
    const newScore = currentScore + pts
    if (pts >= 40) setMessage(`COMBO x${Math.floor(matched.size / 3)}! +${pts}`)
    else setMessage(`+${pts}`)
    setTimeout(() => setMessage(''), 1000)

    // Remove matched cells and fill from top
    const newGrid = g.map(row => row.map(cell => ({ ...cell! })))
    matched.forEach(key => {
      const [r, c] = key.split(',').map(Number)
      newGrid[r][c] = { color: Math.floor(Math.random() * COLORS.length), selected: false }
    })

    return { grid: newGrid, score: newScore }
  }, [])

  const doMove = useCallback((newGrid: Cell[][]) => {
    if (gameState !== 'playing') return
    const newMoves = moves - 1
    const { grid: processed, score: newScore } = processMatches(newGrid, score)
    setGrid(processed)
    setScore(newScore)
    setMoves(newMoves)
    if (newMoves <= 0) {
      setGameState('dead')
      onScoreSubmit(newScore)
    }
  }, [gameState, moves, score, processMatches, onScoreSubmit])

  // Check for initial matches
  useEffect(() => {
    if (gameState !== 'playing') return
    const matched = findMatches(grid)
    if (matched.size > 0) {
      const { grid: processed, score: newScore } = processMatches(grid, score)
      setGrid(processed)
      setScore(newScore)
    }
  }, [gameState])

  const CELL_SIZE = 52

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-8 w-full justify-between mb-2">
        <span className="vt323 text-2xl glow-green">SCORE: {score}</span>
        <span className="vt323 text-2xl" style={{ color: moves <= 5 ? 'var(--neon-pink)' : 'var(--neon-cyan)' }}>
          MOVES: {moves}
        </span>
      </div>

      {message && (
        <div className="glow-yellow text-center" style={{ fontFamily: 'Press Start 2P', fontSize: '12px', minHeight: '24px' }}>
          {message}
        </div>
      )}

      <div
        className="relative"
        style={{
          border: '2px solid var(--neon-cyan)',
          boxShadow: '0 0 10px var(--neon-cyan)',
          background: 'var(--bg-card)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)` }}>
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const key = `${r},${c}`
              const isFlash = flash.has(key)
              return (
                <div
                  key={key}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    background: cell ? COLORS[cell.color] : '#111',
                    opacity: isFlash ? 0.2 : 1,
                    boxShadow: cell ? `inset 0 0 8px rgba(0,0,0,0.4), 0 0 ${isFlash ? 20 : 4}px ${COLORS[cell.color]}` : 'none',
                    transition: 'opacity 0.2s, box-shadow 0.2s',
                    border: '1px solid rgba(0,0,0,0.3)',
                    cursor: 'default',
                  }}
                />
              )
            })
          )}
        </div>

        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4">
            <p className="glow-cyan" style={{ fontFamily: 'Press Start 2P', fontSize: '13px' }}>TRISM</p>
            <p className="vt323 text-center px-4" style={{ color: 'var(--neon-green)', fontSize: '18px', maxWidth: '320px' }}>
              Slide rows & columns to match 3+ colors. You have 30 moves!
            </p>
            <button className="pixel-btn pixel-btn-cyan" onClick={startGame}>INSERT COIN</button>
          </div>
        )}
        {gameState === 'dead' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4">
            <p className="glow-pink" style={{ fontFamily: 'Press Start 2P', fontSize: '13px' }}>TIME&apos;S UP!</p>
            <p className="vt323 text-2xl" style={{ color: 'var(--neon-yellow)' }}>Score: {score}</p>
            <button className="pixel-btn" onClick={startGame}>PLAY AGAIN</button>
          </div>
        )}
      </div>

      {/* Slide Controls */}
      {gameState === 'playing' && (
        <div className="w-full max-w-sm">
          <p className="vt323 text-center mb-3" style={{ color: 'rgba(0,255,255,0.5)', fontSize: '16px' }}>
            SLIDE CONTROLS
          </p>
          <div className="grid gap-2">
            <div className="flex gap-2 justify-center">
              {Array.from({ length: GRID_SIZE }, (_, c) => (
                <button
                  key={c}
                  className="pixel-btn-cyan"
                  style={{
                    fontFamily: 'Press Start 2P',
                    fontSize: '8px',
                    padding: '6px 8px',
                    border: '1px solid var(--neon-cyan)',
                    background: 'transparent',
                    color: 'var(--neon-cyan)',
                    cursor: 'pointer',
                    width: '36px',
                  }}
                  onClick={() => doMove(slideCol(grid, c, 'down'))}
                >
                  ↓
                </button>
              ))}
            </div>
            {Array.from({ length: GRID_SIZE }, (_, r) => (
              <div key={r} className="flex gap-2 items-center justify-center">
                <button
                  style={{ fontFamily: 'Press Start 2P', fontSize: '8px', padding: '6px 8px', border: '1px solid var(--neon-green)', background: 'transparent', color: 'var(--neon-green)', cursor: 'pointer', width: '36px' }}
                  onClick={() => doMove(slideRow(grid, r, 'left'))}
                >→</button>
                <div
                  style={{
                    display: 'flex',
                    gap: '1px',
                  }}
                >
                  {grid[r].map((cell, c) => (
                    <div
                      key={c}
                      style={{
                        width: '36px',
                        height: '36px',
                        background: cell ? COLORS[cell.color] : '#111',
                        border: '1px solid rgba(0,0,0,0.3)',
                      }}
                    />
                  ))}
                </div>
                <button
                  style={{ fontFamily: 'Press Start 2P', fontSize: '8px', padding: '6px 8px', border: '1px solid var(--neon-green)', background: 'transparent', color: 'var(--neon-green)', cursor: 'pointer', width: '36px' }}
                  onClick={() => doMove(slideRow(grid, r, 'right'))}
                >←</button>
              </div>
            ))}
            <div className="flex gap-2 justify-center">
              {Array.from({ length: GRID_SIZE }, (_, c) => (
                <button
                  key={c}
                  style={{ fontFamily: 'Press Start 2P', fontSize: '8px', padding: '6px 8px', border: '1px solid var(--neon-cyan)', background: 'transparent', color: 'var(--neon-cyan)', cursor: 'pointer', width: '36px' }}
                  onClick={() => doMove(slideCol(grid, c, 'up'))}
                >↑</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
