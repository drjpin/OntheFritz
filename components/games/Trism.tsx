'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

const COLS = 8
const ROWS = 8
const CS = 52
const COLORS = ['#ff006e', '#00ffff', '#ffff00', '#00ff9f', '#ff9f00']
const TOTAL_MOVES = 25

interface Cell { color: number; alpha: number; dy: number; flash: boolean }
interface TrismProps { onScoreSubmit: (score: number) => void }

function rnd() { return Math.floor(Math.random() * COLORS.length) }
function freshCell(color?: number): Cell { return { color: color ?? rnd(), alpha: 1, dy: 0, flash: false } }
function makeGrid(): Cell[][] { return Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => freshCell())) }

function drawGrid(ctx: CanvasRenderingContext2D, grid: Cell[][], flashOn: boolean, selDiag?: { type: 'back'|'fwd', idx: number }) {
  ctx.fillStyle = '#05050f'
  ctx.fillRect(0, 0, COLS * CS, ROWS * CS)

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = grid[r][c]
      const x = c * CS
      const y = r * CS + cell.dy
      const upper = (r + c) % 2 === 0
      const onSel = selDiag && (
        (selDiag.type === 'back' && r - c === selDiag.idx) ||
        (selDiag.type === 'fwd' && r + c === selDiag.idx)
      )

      ctx.save()
      ctx.globalAlpha = Math.max(0, Math.min(1, cell.alpha))
      const col = (cell.flash && flashOn) ? '#ffffff' : COLORS[cell.color]
      ctx.fillStyle = col
      ctx.shadowColor = col
      ctx.shadowBlur = cell.flash ? 24 : onSel ? 16 : 8

      ctx.beginPath()
      if (upper) {
        // Upper-left right triangle ◸
        ctx.moveTo(x + 2, y + 2)
        ctx.lineTo(x + CS - 2, y + 2)
        ctx.lineTo(x + 2, y + CS - 2)
      } else {
        // Lower-right right triangle ◿
        ctx.moveTo(x + CS - 2, y + 2)
        ctx.lineTo(x + CS - 2, y + CS - 2)
        ctx.lineTo(x + 2, y + CS - 2)
      }
      ctx.closePath()
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.strokeStyle = onSel ? 'rgba(255,255,255,0.5)' : 'rgba(5,5,15,0.8)'
      ctx.lineWidth = onSel ? 2.5 : 1.5
      ctx.stroke()
      ctx.restore()
    }
  }
}

function findMatches(grid: Cell[][]): Set<string> {
  const matched = new Set<string>()

  function checkLine(line: [number, number][]) {
    let run = 1
    for (let i = 1; i <= line.length; i++) {
      const same = i < line.length &&
        grid[line[i][0]][line[i][1]].color === grid[line[i-1][0]][line[i-1][1]].color &&
        grid[line[i-1][0]][line[i-1][1]].alpha > 0.5
      if (same) {
        run++
      } else {
        if (run >= 3) for (let k = i - run; k < i; k++) matched.add(`${line[k][0]},${line[k][1]}`)
        run = 1
      }
    }
  }

  for (let d = -(ROWS-1); d <= COLS-1; d++) {
    const line: [number, number][] = []
    for (let r = 0; r < ROWS; r++) { const c = r - d; if (c >= 0 && c < COLS) line.push([r, c]) }
    checkLine(line)
  }

  for (let s = 0; s <= ROWS + COLS - 2; s++) {
    const line: [number, number][] = []
    for (let r = 0; r < ROWS; r++) { const c = s - r; if (c >= 0 && c < COLS) line.push([r, c]) }
    checkLine(line)
  }

  return matched
}

function getDiagCells(type: 'back'|'fwd', idx: number): [number, number][] {
  const cells: [number, number][] = []
  for (let r = 0; r < ROWS; r++) {
    const c = type === 'back' ? r - idx : idx - r
    if (c >= 0 && c < COLS) cells.push([r, c])
  }
  return cells
}

function slideGrid(grid: Cell[][], cells: [number, number][], fwd: boolean): Cell[][] {
  const g = grid.map(row => row.map(c => ({ ...c })))
  if (cells.length < 2) return g
  if (fwd) {
    const last = { ...g[cells[cells.length-1][0]][cells[cells.length-1][1]] }
    for (let i = cells.length - 1; i > 0; i--) g[cells[i][0]][cells[i][1]] = { ...g[cells[i-1][0]][cells[i-1][1]] }
    g[cells[0][0]][cells[0][1]] = last
  } else {
    const first = { ...g[cells[0][0]][cells[0][1]] }
    for (let i = 0; i < cells.length - 1; i++) g[cells[i][0]][cells[i][1]] = { ...g[cells[i+1][0]][cells[i+1][1]] }
    g[cells[cells.length-1][0]][cells[cells.length-1][1]] = first
  }
  return g
}

function applyGravity(grid: Cell[][]): Cell[][] {
  const g = grid.map(row => row.map(c => ({ ...c })))
  for (let c = 0; c < COLS; c++) {
    const alive = []
    for (let r = 0; r < ROWS; r++) if (g[r][c].alpha > 0.5) alive.push({ ...g[r][c] })
    const newCount = ROWS - alive.length
    const newCells = Array.from({ length: newCount }, () => freshCell())
    const col = [...newCells, ...alive]
    for (let r = 0; r < ROWS; r++) {
      g[r][c] = { ...col[r], dy: r < newCount ? -(newCount - r) * CS : 0 }
    }
  }
  return g
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

export default function Trism({ onScoreSubmit }: TrismProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gridRef = useRef<Cell[][]>(makeGrid())
  const animRef = useRef(0)
  const busyRef = useRef(false)
  const scoreRef = useRef(0)
  const movesRef = useRef(TOTAL_MOVES)
  const dragRef = useRef<{ x: number; y: number } | null>(null)
  const selRef = useRef<{ type: 'back'|'fwd'; idx: number } | undefined>(undefined)

  const [gameState, setGameState] = useState<'idle'|'playing'|'dead'>('idle')
  const [score, setScore] = useState(0)
  const [moves, setMoves] = useState(TOTAL_MOVES)
  const [flashMsg, setFlashMsg] = useState('')

  const redraw = useCallback((flashOn = true) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) drawGrid(ctx, gridRef.current, flashOn, selRef.current)
  }, [])

  useEffect(() => {
    redraw()
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [redraw])

  const processMatches = useCallback(async (grid: Cell[][], pts: number): Promise<{ grid: Cell[][], pts: number }> => {
    const matched = findMatches(grid)
    if (!matched.size) return { grid, pts }

    const g1 = grid.map(r => r.map(c => ({ ...c })))
    matched.forEach(k => { const [r, c] = k.split(',').map(Number); g1[r][c].flash = true })
    gridRef.current = g1

    // Flash 6 times
    for (let i = 0; i < 6; i++) { redraw(i % 2 === 0); await sleep(90) }

    // Remove + gravity
    const g2 = g1.map(r => r.map(c => ({ ...c, flash: false })))
    matched.forEach(k => { const [r, c] = k.split(',').map(Number); g2[r][c].alpha = 0 })
    const g3 = applyGravity(g2)
    gridRef.current = g3
    redraw()

    // Drop animation
    const start = performance.now()
    await new Promise<void>(resolve => {
      const animate = (now: number) => {
        const t = Math.min(1, (now - start) / 380)
        const ease = 1 - Math.pow(1 - t, 3)
        gridRef.current = g3.map(row => row.map(cell => ({
          ...cell, dy: cell.dy < 0 ? cell.dy * (1 - ease) : 0
        })))
        redraw()
        if (t < 1) animRef.current = requestAnimationFrame(animate)
        else {
          gridRef.current = g3.map(r => r.map(c => ({ ...c, dy: 0 })))
          redraw()
          resolve()
        }
      }
      animRef.current = requestAnimationFrame(animate)
    })

    const newPts = pts + matched.size * 10
    const combo = Math.floor(matched.size / 3)
    setFlashMsg(combo > 1 ? `COMBO x${combo}! +${matched.size * 10}` : `+${matched.size * 10}`)
    setTimeout(() => setFlashMsg(''), 900)

    return processMatches(g3.map(r => r.map(c => ({ ...c, dy: 0 }))), newPts)
  }, [redraw])

  const doMove = useCallback(async (type: 'back'|'fwd', idx: number, fwd: boolean) => {
    if (busyRef.current || gameState !== 'playing') return
    const cells = getDiagCells(type, idx)
    if (cells.length < 2) return

    busyRef.current = true
    const slid = slideGrid(gridRef.current, cells, fwd)
    gridRef.current = slid
    redraw()

    const { grid: final, pts } = await processMatches(slid, scoreRef.current)
    gridRef.current = final
    scoreRef.current = pts
    movesRef.current -= 1
    setScore(pts)
    setMoves(movesRef.current)
    redraw()
    busyRef.current = false

    if (movesRef.current <= 0) {
      setGameState('dead')
      onScoreSubmit(pts)
    }
  }, [gameState, processMatches, redraw, onScoreSubmit])

  const getCell = (x: number, y: number) => ({
    r: Math.max(0, Math.min(ROWS - 1, Math.floor(y / CS))),
    c: Math.max(0, Math.min(COLS - 1, Math.floor(x / CS))),
  })

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left, y = e.clientY - rect.top
    dragRef.current = { x, y }
    const { r, c } = getCell(x, y)
    selRef.current = { type: 'back', idx: r - c }
    redraw()
  }, [redraw])

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left, y = e.clientY - rect.top
    const dx = x - dragRef.current.x, dy = y - dragRef.current.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const { r, c } = getCell(dragRef.current.x, dragRef.current.y)
    selRef.current = undefined

    if (dist < 18) { dragRef.current = null; redraw(); return }

    const angle = Math.atan2(dy, dx) * 180 / Math.PI
    let type: 'back'|'fwd', idx: number, fwd: boolean

    if (angle > -90 && angle <= 90)   { type = 'back'; idx = r - c; fwd = true  }
    else if (angle > 90)              { type = 'fwd';  idx = r + c; fwd = true  }
    else if (angle < -90)             { type = 'back'; idx = r - c; fwd = false }
    else                              { type = 'fwd';  idx = r + c; fwd = false }

    dragRef.current = null
    redraw()
    doMove(type, idx, fwd)
  }, [doMove, redraw])

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const t = e.touches[0]
    const x = t.clientX - rect.left, y = t.clientY - rect.top
    dragRef.current = { x, y }
    const { r, c } = getCell(x, y)
    selRef.current = { type: 'back', idx: r - c }
    redraw()
  }, [redraw])

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!dragRef.current) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const t = e.changedTouches[0]
    const x = t.clientX - rect.left, y = t.clientY - rect.top
    const dx = x - dragRef.current.x, dy = y - dragRef.current.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const { r, c } = getCell(dragRef.current.x, dragRef.current.y)
    selRef.current = undefined
    if (dist < 20) { dragRef.current = null; redraw(); return }

    const angle = Math.atan2(dy, dx) * 180 / Math.PI
    let type: 'back'|'fwd', idx: number, fwd: boolean

    if (angle > -90 && angle <= 90)   { type = 'back'; idx = r - c; fwd = true  }
    else if (angle > 90)              { type = 'fwd';  idx = r + c; fwd = true  }
    else if (angle < -90)             { type = 'back'; idx = r - c; fwd = false }
    else                              { type = 'fwd';  idx = r + c; fwd = false }

    dragRef.current = null
    redraw()
    doMove(type, idx, fwd)
  }, [doMove, redraw])

  const startGame = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    busyRef.current = false
    scoreRef.current = 0
    movesRef.current = TOTAL_MOVES
    selRef.current = undefined
    gridRef.current = makeGrid()
    setScore(0)
    setMoves(TOTAL_MOVES)
    setFlashMsg('')
    setGameState('playing')
    setTimeout(redraw, 30)
  }, [redraw])

  const W = COLS * CS
  const H = ROWS * CS

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-8 w-full justify-between">
        <span className="vt323 text-2xl glow-cyan">SCORE: {score}</span>
        <span className="vt323 text-2xl" style={{ color: moves <= 5 ? 'var(--neon-pink)' : 'var(--neon-green)' }}>
          MOVES: {moves}
        </span>
      </div>

      <div style={{ minHeight: '26px' }}>
        {flashMsg && (
          <p className="glow-yellow" style={{ fontFamily: 'Press Start 2P', fontSize: '11px', textAlign: 'center' }}>
            {flashMsg}
          </p>
        )}
      </div>

      <div className="relative" style={{ userSelect: 'none', touchAction: 'none' }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={{
            display: 'block',
            border: '2px solid var(--neon-cyan)',
            boxShadow: '0 0 12px var(--neon-cyan)',
            cursor: gameState === 'playing' ? 'crosshair' : 'default',
          }}
          onMouseDown={gameState === 'playing' ? handleMouseDown : undefined}
          onMouseUp={gameState === 'playing' ? handleMouseUp : undefined}
          onMouseLeave={() => { dragRef.current = null; selRef.current = undefined; redraw() }}
          onTouchStart={gameState === 'playing' ? handleTouchStart : undefined}
          onTouchEnd={gameState === 'playing' ? handleTouchEnd : undefined}
        />

        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-3">
            <p className="glow-cyan" style={{ fontFamily: 'Press Start 2P', fontSize: '13px' }}>TRISM</p>
            <p className="vt323 text-center px-6" style={{ color: 'var(--neon-green)', fontSize: '19px', maxWidth: '340px', lineHeight: '1.5' }}>
              Swipe diagonally on the grid to slide lines of triangles. Match 3+ of the same color!
            </p>
            <div className="vt323 text-center" style={{ color: 'rgba(0,255,255,0.65)', fontSize: '17px', lineHeight: 1.7 }}>
              ↘ swipe → slide \\ line down-right<br />
              ↖ swipe → slide \\ line up-left<br />
              ↙ swipe → slide / line down-left<br />
              ↗ swipe → slide / line up-right
            </div>
            <button className="pixel-btn pixel-btn-cyan" onClick={startGame}>INSERT COIN</button>
          </div>
        )}

        {gameState === 'dead' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4">
            <p className="glow-pink" style={{ fontFamily: 'Press Start 2P', fontSize: '13px' }}>OUT OF MOVES</p>
            <p className="vt323 text-2xl" style={{ color: 'var(--neon-yellow)' }}>Score: {score}</p>
            <button className="pixel-btn" onClick={startGame}>PLAY AGAIN</button>
          </div>
        )}
      </div>

      <p className="vt323 text-center" style={{ color: 'rgba(0,255,255,0.35)', fontSize: '15px' }}>
        Click &amp; swipe diagonally — \\ or / directions only
      </p>
    </div>
  )
}
