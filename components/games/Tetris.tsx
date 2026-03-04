'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

const COLS = 10
const ROWS = 20
const BLOCK = 28

const COLORS = [
  '',
  '#00ffff', // I - cyan
  '#ffff00', // O - yellow
  '#aa00ff', // T - purple
  '#00ff9f', // S - neon green
  '#ff006e', // Z - neon pink
  '#ff8800', // J - orange
  '#0088ff', // L - blue
]

const PIECES = [
  [], // placeholder
  [[1,1,1,1]],                         // I
  [[1,1],[1,1]],                        // O
  [[0,1,0],[1,1,1]],                    // T
  [[0,1,1],[1,1,0]],                    // S
  [[1,1,0],[0,1,1]],                    // Z
  [[1,0,0],[1,1,1]],                    // J
  [[0,0,1],[1,1,1]],                    // L
]

type Board = number[][]

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0))
}

function randomPiece() {
  return Math.floor(Math.random() * 7) + 1
}

function rotate(matrix: number[][]): number[][] {
  const rows = matrix.length
  const cols = matrix[0].length
  const result: number[][] = Array.from({ length: cols }, () => Array(rows).fill(0))
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[c][rows - 1 - r] = matrix[r][c]
  return result
}

const SCORES = [0, 100, 300, 500, 800]

export default function Tetris({ onScoreSubmit }: { onScoreSubmit?: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nextCanvasRef = useRef<HTMLCanvasElement>(null)

  const boardRef = useRef<Board>(emptyBoard())
  const pieceRef = useRef(randomPiece())
  const nextPieceRef = useRef(randomPiece())
  const shapeRef = useRef<number[][]>(PIECES[pieceRef.current])
  const posRef = useRef({ x: Math.floor(COLS / 2) - 1, y: 0 })

  const scoreRef = useRef(0)
  const linesRef = useRef(0)
  const levelRef = useRef(1)
  const gameOverRef = useRef(false)
  const pausedRef = useRef(false)
  const startedRef = useRef(false)
  const dropTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const rafRef = useRef<number>(0)

  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)

  const dropInterval = useCallback(() => Math.max(100, 800 - (levelRef.current - 1) * 70), [])

  function isValid(shape: number[][], px: number, py: number, board: Board) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue
        const nx = px + c, ny = py + r
        if (nx < 0 || nx >= COLS || ny >= ROWS) return false
        if (ny >= 0 && board[ny][nx]) return false
      }
    }
    return true
  }

  function lockPiece() {
    const board = boardRef.current
    const shape = shapeRef.current
    const { x, y } = posRef.current
    const pid = pieceRef.current

    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        if (shape[r][c] && y + r >= 0)
          board[y + r][x + c] = pid

    // Clear lines
    let cleared = 0
    for (let r = ROWS - 1; r >= 0; ) {
      if (board[r].every(v => v)) {
        board.splice(r, 1)
        board.unshift(Array(COLS).fill(0))
        cleared++
      } else {
        r--
      }
    }

    if (cleared > 0) {
      const gained = SCORES[cleared] * levelRef.current
      scoreRef.current += gained
      linesRef.current += cleared
      levelRef.current = Math.floor(linesRef.current / 10) + 1
      setScore(scoreRef.current)
      setLines(linesRef.current)
      setLevel(levelRef.current)
      restartDropTimer()
    }

    // Spawn next
    pieceRef.current = nextPieceRef.current
    nextPieceRef.current = randomPiece()
    shapeRef.current = PIECES[pieceRef.current]
    posRef.current = { x: Math.floor(COLS / 2) - Math.ceil(shapeRef.current[0].length / 2), y: 0 }

    if (!isValid(shapeRef.current, posRef.current.x, posRef.current.y, board)) {
      gameOverRef.current = true
      setGameOver(true)
      if (dropTimerRef.current) clearInterval(dropTimerRef.current)
      onScoreSubmit?.(scoreRef.current)
    }

    drawAll()
    drawNext()
  }

  function drop() {
    if (gameOverRef.current || pausedRef.current) return
    const { x, y } = posRef.current
    if (isValid(shapeRef.current, x, y + 1, boardRef.current)) {
      posRef.current = { x, y: y + 1 }
    } else {
      lockPiece()
    }
    drawAll()
  }

  function hardDrop() {
    let { x, y } = posRef.current
    while (isValid(shapeRef.current, x, y + 1, boardRef.current)) y++
    posRef.current = { x, y }
    lockPiece()
    drawAll()
  }

  function ghostY() {
    let { x, y } = posRef.current
    while (isValid(shapeRef.current, x, y + 1, boardRef.current)) y++
    return y
  }

  function restartDropTimer() {
    if (dropTimerRef.current) clearInterval(dropTimerRef.current)
    dropTimerRef.current = setInterval(() => drop(), dropInterval())
  }

  const drawAll = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Background grid
    ctx.strokeStyle = 'rgba(0,255,159,0.06)'
    ctx.lineWidth = 0.5
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * BLOCK); ctx.lineTo(COLS * BLOCK, r * BLOCK); ctx.stroke()
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * BLOCK, 0); ctx.lineTo(c * BLOCK, ROWS * BLOCK); ctx.stroke()
    }

    // Board
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = boardRef.current[r][c]
        if (!v) continue
        drawBlock(ctx, c, r, COLORS[v], 1)
      }
    }

    // Ghost piece
    const gy = ghostY()
    const { x } = posRef.current
    for (let r = 0; r < shapeRef.current.length; r++)
      for (let c = 0; c < shapeRef.current[r].length; c++)
        if (shapeRef.current[r][c])
          drawBlock(ctx, x + c, gy + r, COLORS[pieceRef.current], 0.18)

    // Active piece
    const { y } = posRef.current
    for (let r = 0; r < shapeRef.current.length; r++)
      for (let c = 0; c < shapeRef.current[r].length; c++)
        if (shapeRef.current[r][c])
          drawBlock(ctx, x + c, y + r, COLORS[pieceRef.current], 1)

    // Game over overlay
    if (gameOverRef.current) {
      ctx.fillStyle = 'rgba(5,5,15,0.75)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ff006e'
      ctx.font = `bold 18px "Press Start 2P"`
      ctx.textAlign = 'center'
      ctx.shadowColor = '#ff006e'
      ctx.shadowBlur = 20
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20)
      ctx.shadowBlur = 0
      ctx.fillStyle = 'rgba(0,255,159,0.8)'
      ctx.font = `12px "Press Start 2P"`
      ctx.fillText('SCORE: ' + scoreRef.current, canvas.width / 2, canvas.height / 2 + 14)
    }

    // Pause overlay
    if (pausedRef.current && !gameOverRef.current) {
      ctx.fillStyle = 'rgba(5,5,15,0.7)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#00ffff'
      ctx.font = `16px "Press Start 2P"`
      ctx.textAlign = 'center'
      ctx.shadowColor = '#00ffff'
      ctx.shadowBlur = 20
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2)
      ctx.shadowBlur = 0
    }
  }, [])

  const drawNext = useCallback(() => {
    const canvas = nextCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const shape = PIECES[nextPieceRef.current]
    const color = COLORS[nextPieceRef.current]
    const bs = 24
    const offX = Math.floor((4 - shape[0].length) / 2) * bs + 4
    const offY = Math.floor((4 - shape.length) / 2) * bs + 4
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        if (shape[r][c]) {
          ctx.fillStyle = color
          ctx.shadowColor = color
          ctx.shadowBlur = 10
          ctx.fillRect(offX + c * bs + 2, offY + r * bs + 2, bs - 4, bs - 4)
          ctx.shadowBlur = 0
          // Highlight
          ctx.fillStyle = 'rgba(255,255,255,0.25)'
          ctx.fillRect(offX + c * bs + 2, offY + r * bs + 2, bs - 4, 4)
        }
  }, [])

  function drawBlock(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, alpha: number) {
    ctx.globalAlpha = alpha
    ctx.fillStyle = color
    ctx.shadowColor = color
    ctx.shadowBlur = alpha > 0.5 ? 8 : 0
    ctx.fillRect(cx * BLOCK + 1, cy * BLOCK + 1, BLOCK - 2, BLOCK - 2)
    // Inner highlight
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillRect(cx * BLOCK + 2, cy * BLOCK + 2, BLOCK - 4, 5)
    ctx.shadowBlur = 0
    ctx.globalAlpha = 1
  }

  function startGame() {
    boardRef.current = emptyBoard()
    pieceRef.current = randomPiece()
    nextPieceRef.current = randomPiece()
    shapeRef.current = PIECES[pieceRef.current]
    posRef.current = { x: Math.floor(COLS / 2) - 1, y: 0 }
    scoreRef.current = 0
    linesRef.current = 0
    levelRef.current = 1
    gameOverRef.current = false
    pausedRef.current = false
    startedRef.current = true
    setScore(0); setLines(0); setLevel(1); setGameOver(false); setPaused(false); setStarted(true)
    restartDropTimer()
    drawAll()
    drawNext()
  }

  function togglePause() {
    if (!startedRef.current || gameOverRef.current) return
    pausedRef.current = !pausedRef.current
    setPaused(pausedRef.current)
    if (pausedRef.current) {
      if (dropTimerRef.current) clearInterval(dropTimerRef.current)
    } else {
      restartDropTimer()
    }
    drawAll()
  }

  useEffect(() => {
    drawAll()
    drawNext()

    const onKey = (e: KeyboardEvent) => {
      if (!startedRef.current || gameOverRef.current) return
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') { togglePause(); return }
      if (pausedRef.current) return

      const { x, y } = posRef.current
      if (e.key === 'ArrowLeft') {
        if (isValid(shapeRef.current, x - 1, y, boardRef.current))
          posRef.current = { x: x - 1, y }
      } else if (e.key === 'ArrowRight') {
        if (isValid(shapeRef.current, x + 1, y, boardRef.current))
          posRef.current = { x: x + 1, y }
      } else if (e.key === 'ArrowDown') {
        drop()
      } else if (e.key === 'ArrowUp' || e.key === 'x' || e.key === 'X') {
        const rotated = rotate(shapeRef.current)
        if (isValid(rotated, x, y, boardRef.current)) {
          shapeRef.current = rotated
        } else if (isValid(rotated, x - 1, y, boardRef.current)) {
          shapeRef.current = rotated; posRef.current = { x: x - 1, y }
        } else if (isValid(rotated, x + 1, y, boardRef.current)) {
          shapeRef.current = rotated; posRef.current = { x: x + 1, y }
        }
      } else if (e.key === ' ') {
        e.preventDefault()
        hardDrop()
        return
      } else {
        return
      }
      drawAll()
    }

    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (dropTimerRef.current) clearInterval(dropTimerRef.current)
      cancelAnimationFrame(rafRef.current)
    }
  }, [drawAll, drawNext])

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-6 items-start">
        {/* Game board */}
        <div style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            width={COLS * BLOCK}
            height={ROWS * BLOCK}
            style={{
              border: '2px solid var(--neon-green)',
              boxShadow: '0 0 20px var(--neon-green)',
              background: '#05050f',
              display: 'block',
            }}
          />
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '120px' }}>
          {/* Next piece */}
          <div className="arcade-card" style={{ border: '1px solid var(--neon-green)', padding: '12px' }}>
            <p style={{ fontFamily: 'Press Start 2P', fontSize: '7px', color: 'var(--neon-green)', marginBottom: '8px' }}>NEXT</p>
            <canvas ref={nextCanvasRef} width={4 * 24 + 8} height={4 * 24 + 8} style={{ background: 'transparent' }} />
          </div>

          {/* Stats */}
          <div className="arcade-card" style={{ border: '1px solid var(--neon-green)', padding: '12px' }}>
            <p style={{ fontFamily: 'Press Start 2P', fontSize: '7px', color: 'rgba(0,255,159,0.5)', marginBottom: '4px' }}>SCORE</p>
            <p className="glow-green" style={{ fontFamily: 'Press Start 2P', fontSize: '11px', marginBottom: '12px' }}>{score}</p>
            <p style={{ fontFamily: 'Press Start 2P', fontSize: '7px', color: 'rgba(0,255,159,0.5)', marginBottom: '4px' }}>LINES</p>
            <p className="glow-green" style={{ fontFamily: 'Press Start 2P', fontSize: '11px', marginBottom: '12px' }}>{lines}</p>
            <p style={{ fontFamily: 'Press Start 2P', fontSize: '7px', color: 'rgba(0,255,159,0.5)', marginBottom: '4px' }}>LEVEL</p>
            <p className="glow-green" style={{ fontFamily: 'Press Start 2P', fontSize: '11px' }}>{level}</p>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {!started || gameOver ? (
              <button className="pixel-btn" style={{ fontSize: '9px', padding: '10px 8px' }} onClick={startGame}>
                {gameOver ? 'PLAY AGAIN' : 'START'}
              </button>
            ) : (
              <button className="pixel-btn pixel-btn-cyan" style={{ fontSize: '9px', padding: '10px 8px' }} onClick={togglePause}>
                {paused ? 'RESUME' : 'PAUSE'}
              </button>
            )}
          </div>

          {/* Key guide */}
          <div style={{ opacity: 0.5 }}>
            <p className="vt323" style={{ fontSize: '15px', color: 'var(--neon-green)', lineHeight: '1.6' }}>
              ← → Move<br/>
              ↑ Rotate<br/>
              ↓ Soft drop<br/>
              SPC Hard drop<br/>
              P Pause
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
