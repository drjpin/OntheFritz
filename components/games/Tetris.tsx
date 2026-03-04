'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

const COLS = 10
const ROWS = 20
const BLOCK = 28

const COLORS = [
  '',
  '#00ffff', // I
  '#ffff00', // O
  '#aa00ff', // T
  '#00ff9f', // S
  '#ff006e', // Z
  '#ff8800', // J
  '#0088ff', // L
]

const PIECES = [
  [],
  [[1,1,1,1]],
  [[1,1],[1,1]],
  [[0,1,0],[1,1,1]],
  [[0,1,1],[1,1,0]],
  [[1,1,0],[0,1,1]],
  [[1,0,0],[1,1,1]],
  [[0,0,1],[1,1,1]],
]

type Board = number[][]

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0))
}

function randomPiece() { return Math.floor(Math.random() * 7) + 1 }

function rotate(matrix: number[][]): number[][] {
  const rows = matrix.length, cols = matrix[0].length
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
  const containerRef = useRef<HTMLDivElement>(null)

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
  const repeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  const [score, setScore] = useState(0)
  const [lines, setLines] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameOver, setGameOver] = useState(false)
  const [started, setStarted] = useState(false)
  const [paused, setPaused] = useState(false)
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

  const dropInterval = useCallback(() => Math.max(100, 800 - (levelRef.current - 1) * 70), [])

  function isValid(shape: number[][], px: number, py: number, board: Board) {
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue
        const nx = px + c, ny = py + r
        if (nx < 0 || nx >= COLS || ny >= ROWS) return false
        if (ny >= 0 && board[ny][nx]) return false
      }
    return true
  }

  const drawAll = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = 'rgba(0,255,159,0.06)'
    ctx.lineWidth = 0.5
    for (let r = 0; r <= ROWS; r++) { ctx.beginPath(); ctx.moveTo(0, r * BLOCK); ctx.lineTo(COLS * BLOCK, r * BLOCK); ctx.stroke() }
    for (let c = 0; c <= COLS; c++) { ctx.beginPath(); ctx.moveTo(c * BLOCK, 0); ctx.lineTo(c * BLOCK, ROWS * BLOCK); ctx.stroke() }

    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const v = boardRef.current[r][c]
        if (v) drawBlock(ctx, c, r, COLORS[v], 1)
      }

    // Ghost
    let { x } = posRef.current
    let gy = posRef.current.y
    while (isValid(shapeRef.current, x, gy + 1, boardRef.current)) gy++
    for (let r = 0; r < shapeRef.current.length; r++)
      for (let c = 0; c < shapeRef.current[r].length; c++)
        if (shapeRef.current[r][c]) drawBlock(ctx, x + c, gy + r, COLORS[pieceRef.current], 0.18)

    // Active piece
    const { y } = posRef.current
    for (let r = 0; r < shapeRef.current.length; r++)
      for (let c = 0; c < shapeRef.current[r].length; c++)
        if (shapeRef.current[r][c]) drawBlock(ctx, x + c, y + r, COLORS[pieceRef.current], 1)

    if (gameOverRef.current) {
      ctx.fillStyle = 'rgba(5,5,15,0.75)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#ff006e'; ctx.font = `bold 18px "Press Start 2P"`; ctx.textAlign = 'center'
      ctx.shadowColor = '#ff006e'; ctx.shadowBlur = 20
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 20)
      ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(0,255,159,0.8)'; ctx.font = `12px "Press Start 2P"`
      ctx.fillText('SCORE: ' + scoreRef.current, canvas.width / 2, canvas.height / 2 + 14)
    }

    if (pausedRef.current && !gameOverRef.current) {
      ctx.fillStyle = 'rgba(5,5,15,0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#00ffff'; ctx.font = `16px "Press Start 2P"`; ctx.textAlign = 'center'
      ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 20
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2)
      ctx.shadowBlur = 0
    }
  }, [])

  const drawNext = useCallback(() => {
    const canvas = nextCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const shape = PIECES[nextPieceRef.current], color = COLORS[nextPieceRef.current], bs = 24
    const offX = Math.floor((4 - shape[0].length) / 2) * bs + 4
    const offY = Math.floor((4 - shape.length) / 2) * bs + 4
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        if (shape[r][c]) {
          ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 10
          ctx.fillRect(offX + c * bs + 2, offY + r * bs + 2, bs - 4, bs - 4)
          ctx.shadowBlur = 0
          ctx.fillStyle = 'rgba(255,255,255,0.25)'
          ctx.fillRect(offX + c * bs + 2, offY + r * bs + 2, bs - 4, 4)
        }
  }, [])

  function drawBlock(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string, alpha: number) {
    ctx.globalAlpha = alpha
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = alpha > 0.5 ? 8 : 0
    ctx.fillRect(cx * BLOCK + 1, cy * BLOCK + 1, BLOCK - 2, BLOCK - 2)
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillRect(cx * BLOCK + 2, cy * BLOCK + 2, BLOCK - 4, 5)
    ctx.shadowBlur = 0; ctx.globalAlpha = 1
  }

  function restartDropTimer() {
    if (dropTimerRef.current) clearInterval(dropTimerRef.current)
    dropTimerRef.current = setInterval(() => drop(), dropInterval())
  }

  function lockPiece() {
    const board = boardRef.current, shape = shapeRef.current
    const { x, y } = posRef.current, pid = pieceRef.current
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        if (shape[r][c] && y + r >= 0) board[y + r][x + c] = pid

    let cleared = 0
    for (let r = ROWS - 1; r >= 0; ) {
      if (board[r].every(v => v)) { board.splice(r, 1); board.unshift(Array(COLS).fill(0)); cleared++ }
      else r--
    }

    if (cleared > 0) {
      scoreRef.current += SCORES[cleared] * levelRef.current
      linesRef.current += cleared
      levelRef.current = Math.floor(linesRef.current / 10) + 1
      setScore(scoreRef.current); setLines(linesRef.current); setLevel(levelRef.current)
      restartDropTimer()
    }

    pieceRef.current = nextPieceRef.current
    nextPieceRef.current = randomPiece()
    shapeRef.current = PIECES[pieceRef.current]
    posRef.current = { x: Math.floor(COLS / 2) - Math.ceil(shapeRef.current[0].length / 2), y: 0 }

    if (!isValid(shapeRef.current, posRef.current.x, posRef.current.y, board)) {
      gameOverRef.current = true; setGameOver(true)
      if (dropTimerRef.current) clearInterval(dropTimerRef.current)
      onScoreSubmit?.(scoreRef.current)
    }
    drawAll(); drawNext()
  }

  function drop() {
    if (gameOverRef.current || pausedRef.current) return
    const { x, y } = posRef.current
    if (isValid(shapeRef.current, x, y + 1, boardRef.current)) posRef.current = { x, y: y + 1 }
    else lockPiece()
    drawAll()
  }

  function hardDrop() {
    let { x, y } = posRef.current
    while (isValid(shapeRef.current, x, y + 1, boardRef.current)) y++
    posRef.current = { x, y }
    lockPiece(); drawAll()
  }

  // Exposed movement functions for buttons
  const moveLeft = useCallback(() => {
    if (!startedRef.current || gameOverRef.current || pausedRef.current) return
    const { x, y } = posRef.current
    if (isValid(shapeRef.current, x - 1, y, boardRef.current)) posRef.current = { x: x - 1, y }
    drawAll()
  }, [drawAll])

  const moveRight = useCallback(() => {
    if (!startedRef.current || gameOverRef.current || pausedRef.current) return
    const { x, y } = posRef.current
    if (isValid(shapeRef.current, x + 1, y, boardRef.current)) posRef.current = { x: x + 1, y }
    drawAll()
  }, [drawAll])

  const rotatePiece = useCallback(() => {
    if (!startedRef.current || gameOverRef.current || pausedRef.current) return
    const { x, y } = posRef.current
    const rotated = rotate(shapeRef.current)
    if (isValid(rotated, x, y, boardRef.current)) shapeRef.current = rotated
    else if (isValid(rotated, x - 1, y, boardRef.current)) { shapeRef.current = rotated; posRef.current = { x: x - 1, y } }
    else if (isValid(rotated, x + 1, y, boardRef.current)) { shapeRef.current = rotated; posRef.current = { x: x + 1, y } }
    drawAll()
  }, [drawAll])

  const softDrop = useCallback(() => {
    if (!startedRef.current || gameOverRef.current || pausedRef.current) return
    drop(); drawAll()
  }, [drawAll])

  const triggerHardDrop = useCallback(() => {
    if (!startedRef.current || gameOverRef.current || pausedRef.current) return
    hardDrop()
  }, [])

  // DAS (auto-repeat) for held buttons
  const startRepeat = useCallback((fn: () => void) => {
    fn()
    if (repeatRef.current) clearInterval(repeatRef.current)
    repeatRef.current = setInterval(fn, 80)
  }, [])

  const stopRepeat = useCallback(() => {
    if (repeatRef.current) { clearInterval(repeatRef.current); repeatRef.current = null }
  }, [])

  function startGame() {
    boardRef.current = emptyBoard()
    pieceRef.current = randomPiece(); nextPieceRef.current = randomPiece()
    shapeRef.current = PIECES[pieceRef.current]
    posRef.current = { x: Math.floor(COLS / 2) - 1, y: 0 }
    scoreRef.current = 0; linesRef.current = 0; levelRef.current = 1
    gameOverRef.current = false; pausedRef.current = false; startedRef.current = true
    setScore(0); setLines(0); setLevel(1); setGameOver(false); setPaused(false); setStarted(true)
    restartDropTimer(); drawAll(); drawNext()
  }

  function togglePause() {
    if (!startedRef.current || gameOverRef.current) return
    pausedRef.current = !pausedRef.current; setPaused(pausedRef.current)
    if (pausedRef.current) { if (dropTimerRef.current) clearInterval(dropTimerRef.current) }
    else restartDropTimer()
    drawAll()
  }

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
    const absDx = Math.abs(dx), absDy = Math.abs(dy)
    if (absDx < 10 && absDy < 10) { rotatePiece(); return } // tap = rotate
    if (absDx > absDy) {
      if (dx < 0) moveLeft(); else moveRight()
    } else {
      if (dy > 0) triggerHardDrop()
    }
    touchStartRef.current = null
  }, [moveLeft, moveRight, rotatePiece, triggerHardDrop])

  useEffect(() => {
    drawAll(); drawNext()
    const onKey = (e: KeyboardEvent) => {
      if (!startedRef.current || gameOverRef.current) return
      if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') { togglePause(); return }
      if (pausedRef.current) return
      const { x, y } = posRef.current
      if (e.key === 'ArrowLeft') { if (isValid(shapeRef.current, x - 1, y, boardRef.current)) posRef.current = { x: x - 1, y } }
      else if (e.key === 'ArrowRight') { if (isValid(shapeRef.current, x + 1, y, boardRef.current)) posRef.current = { x: x + 1, y } }
      else if (e.key === 'ArrowDown') { drop() }
      else if (e.key === 'ArrowUp' || e.key === 'x' || e.key === 'X') { rotatePiece() }
      else if (e.key === ' ') { e.preventDefault(); hardDrop(); return }
      else return
      drawAll()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (dropTimerRef.current) clearInterval(dropTimerRef.current)
      if (repeatRef.current) clearInterval(repeatRef.current)
    }
  }, [drawAll, drawNext, moveLeft, moveRight, rotatePiece])

  const btnStyle: React.CSSProperties = {
    fontFamily: 'Press Start 2P',
    fontSize: '11px',
    padding: '14px 10px',
    background: 'rgba(0,255,159,0.1)',
    border: '2px solid var(--neon-green)',
    color: 'var(--neon-green)',
    cursor: 'pointer',
    userSelect: 'none',
    WebkitUserSelect: 'none',
    touchAction: 'none',
    minWidth: '56px',
    boxShadow: '0 0 6px rgba(0,255,159,0.2)',
  }

  const wideBtn: React.CSSProperties = { ...btnStyle, flex: 1, fontSize: '9px', padding: '14px 8px' }

  return (
    <div
      ref={containerRef}
      style={{ background: '#05050f', padding: isFullscreen ? '16px' : '0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Board + side panel */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* Canvas */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              style={{ position: 'absolute', top: '4px', right: '4px', zIndex: 10, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(0,255,159,0.3)', color: 'rgba(0,255,159,0.7)', cursor: 'pointer', fontSize: '14px', padding: '2px 6px', lineHeight: 1 }}
            >
              {isFullscreen ? '⊠' : '⛶'}
            </button>
            <canvas
              ref={canvasRef}
              width={COLS * BLOCK}
              height={ROWS * BLOCK}
              style={{ border: '2px solid var(--neon-green)', boxShadow: '0 0 20px var(--neon-green)', background: '#05050f', display: 'block' }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            />
          </div>

          {/* Side panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minWidth: '110px', maxWidth: '160px' }}>
            <div className="arcade-card" style={{ border: '1px solid var(--neon-green)', padding: '10px' }}>
              <p style={{ fontFamily: 'Press Start 2P', fontSize: '7px', color: 'var(--neon-green)', marginBottom: '6px' }}>NEXT</p>
              <canvas ref={nextCanvasRef} width={4 * 24 + 8} height={4 * 24 + 8} style={{ background: 'transparent' }} />
            </div>
            <div className="arcade-card" style={{ border: '1px solid var(--neon-green)', padding: '10px' }}>
              <p style={{ fontFamily: 'Press Start 2P', fontSize: '7px', color: 'rgba(0,255,159,0.5)', marginBottom: '3px' }}>SCORE</p>
              <p className="glow-green" style={{ fontFamily: 'Press Start 2P', fontSize: '10px', marginBottom: '10px' }}>{score}</p>
              <p style={{ fontFamily: 'Press Start 2P', fontSize: '7px', color: 'rgba(0,255,159,0.5)', marginBottom: '3px' }}>LINES</p>
              <p className="glow-green" style={{ fontFamily: 'Press Start 2P', fontSize: '10px', marginBottom: '10px' }}>{lines}</p>
              <p style={{ fontFamily: 'Press Start 2P', fontSize: '7px', color: 'rgba(0,255,159,0.5)', marginBottom: '3px' }}>LEVEL</p>
              <p className="glow-green" style={{ fontFamily: 'Press Start 2P', fontSize: '10px' }}>{level}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {!started || gameOver ? (
                <button className="pixel-btn" style={{ fontSize: '8px', padding: '10px 8px' }} onClick={startGame}>
                  {gameOver ? 'PLAY AGAIN' : 'START'}
                </button>
              ) : (
                <button className="pixel-btn pixel-btn-cyan" style={{ fontSize: '8px', padding: '10px 8px' }} onClick={togglePause}>
                  {paused ? 'RESUME' : 'PAUSE'}
                </button>
              )}
            </div>
            <div style={{ opacity: 0.45 }}>
              <p className="vt323" style={{ fontSize: '14px', color: 'var(--neon-green)', lineHeight: '1.7' }}>
                ← → Move<br />↑ Rotate<br />↓ Soft drop<br />SPC Hard drop<br />P Pause
              </p>
            </div>
          </div>
        </div>

        {/* On-screen action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center', width: '100%', maxWidth: '320px' }}>
          <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
            <button
              style={btnStyle}
              onPointerDown={() => startRepeat(moveLeft)}
              onPointerUp={stopRepeat}
              onPointerLeave={stopRepeat}
              onPointerCancel={stopRepeat}
            >◀</button>
            <button style={{ ...btnStyle, flex: 1 }} onPointerDown={rotatePiece}>↻ ROTATE</button>
            <button
              style={btnStyle}
              onPointerDown={() => startRepeat(moveRight)}
              onPointerUp={stopRepeat}
              onPointerLeave={stopRepeat}
              onPointerCancel={stopRepeat}
            >▶</button>
          </div>
          <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
            <button
              style={wideBtn}
              onPointerDown={() => startRepeat(softDrop)}
              onPointerUp={stopRepeat}
              onPointerLeave={stopRepeat}
              onPointerCancel={stopRepeat}
            >▼ SOFT</button>
            <button style={wideBtn} onPointerDown={triggerHardDrop}>⬇ HARD</button>
          </div>
        </div>
      </div>
    </div>
  )
}
