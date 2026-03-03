'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

const COLS = 11
const ROWS = 8
const TW = 58
const TH = 50
const CW = Math.ceil((COLS + 1) * TW / 2)
const CH = ROWS * TH
const COLORS = ['#ff006e', '#00ffff', '#ffff00', '#00ff9f', '#ff9f00']
const TOTAL_MOVES = 30

interface Cell { color: number; alpha: number; dy: number; flash: boolean }
interface TrismProps { onScoreSubmit: (score: number) => void }

function rnd() { return Math.floor(Math.random() * COLORS.length) }
function freshCell(color?: number): Cell { return { color: color ?? rnd(), alpha: 1, dy: 0, flash: false } }

// Generate a grid with no pre-existing matches
function makeGrid(): Cell[][] {
  const grid: Cell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => freshCell())
  )
  // Clear any starting matches by randomizing conflicting cells
  for (let attempts = 0; attempts < 5; attempts++) {
    const matches = findMatchesRaw(grid)
    if (matches.size === 0) break
    matches.forEach(k => {
      const [r, c] = k.split(',').map(Number)
      grid[r][c] = freshCell()
    })
  }
  return grid
}

// ── Drawing ────────────────────────────────────────────────────────────────

function triVerts(r: number, c: number, dy = 0): [number, number][] {
  const xL = c * TW / 2
  const yT = r * TH + dy
  const yB = (r + 1) * TH + dy
  const up = (r + c) % 2 === 0
  return up
    ? [[xL + 2, yB - 2], [xL + TW / 2, yT + 2], [xL + TW - 2, yB - 2]]
    : [[xL + 2, yT + 2], [xL + TW - 2, yT + 2], [xL + TW / 2, yB - 2]]
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  grid: Cell[][],
  flashOn: boolean,
  sel?: { kind: 'row' | 'back' | 'fwd'; idx: number }
) {
  ctx.fillStyle = '#05050f'
  ctx.fillRect(0, 0, CW, CH)
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = grid[r][c]
      const verts = triVerts(r, c, cell.dy)
      const onSel = sel && (
        (sel.kind === 'row'  && r === sel.idx) ||
        (sel.kind === 'back' && r - c === sel.idx) ||
        (sel.kind === 'fwd'  && r + c === sel.idx)
      )
      ctx.save()
      ctx.globalAlpha = Math.max(0, Math.min(1, cell.alpha))
      const col = cell.flash && flashOn ? '#ffffff' : COLORS[cell.color]
      ctx.fillStyle = col
      ctx.shadowColor = col
      ctx.shadowBlur = cell.flash ? 28 : onSel ? 18 : 10
      ctx.beginPath()
      ctx.moveTo(verts[0][0], verts[0][1])
      ctx.lineTo(verts[1][0], verts[1][1])
      ctx.lineTo(verts[2][0], verts[2][1])
      ctx.closePath()
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.strokeStyle = onSel ? 'rgba(255,255,255,0.5)' : 'rgba(5,5,15,0.85)'
      ctx.lineWidth = onSel ? 2.5 : 1.5
      ctx.stroke()
      ctx.restore()
    }
  }
}

// ── Match detection ────────────────────────────────────────────────────────

function checkLine(grid: Cell[][], line: [number, number][], out: Set<string>) {
  let run = 1
  for (let i = 1; i <= line.length; i++) {
    const alive = (rr: number, cc: number) => grid[rr][cc].alpha > 0.5
    const same = i < line.length &&
      alive(line[i][0], line[i][1]) &&
      alive(line[i-1][0], line[i-1][1]) &&
      grid[line[i][0]][line[i][1]].color === grid[line[i-1][0]][line[i-1][1]].color
    if (same) {
      run++
    } else {
      if (run >= 3) for (let k = i - run; k < i; k++) out.add(`${line[k][0]},${line[k][1]}`)
      run = 1
    }
  }
}

function findMatchesRaw(grid: Cell[][]): Set<string> {
  const matched = new Set<string>()

  // Horizontal rows
  for (let r = 0; r < ROWS; r++) {
    const line: [number, number][] = Array.from({ length: COLS }, (_, c) => [r, c])
    checkLine(grid, line, matched)
  }

  // \ diagonals (r - c = d)
  for (let d = -(ROWS - 1); d <= COLS - 1; d++) {
    const line: [number, number][] = []
    for (let r = 0; r < ROWS; r++) { const c = r - d; if (c >= 0 && c < COLS) line.push([r, c]) }
    checkLine(grid, line, matched)
  }

  // / anti-diagonals (r + c = s)
  for (let s = 0; s <= ROWS + COLS - 2; s++) {
    const line: [number, number][] = []
    for (let r = 0; r < ROWS; r++) { const c = s - r; if (c >= 0 && c < COLS) line.push([r, c]) }
    checkLine(grid, line, matched)
  }

  return matched
}

// ── Sliding ────────────────────────────────────────────────────────────────

function getLineCells(kind: 'row' | 'back' | 'fwd', idx: number): [number, number][] {
  const cells: [number, number][] = []
  if (kind === 'row') {
    for (let c = 0; c < COLS; c++) cells.push([idx, c])
  } else if (kind === 'back') {
    for (let r = 0; r < ROWS; r++) { const c = r - idx; if (c >= 0 && c < COLS) cells.push([r, c]) }
  } else {
    for (let r = 0; r < ROWS; r++) { const c = idx - r; if (c >= 0 && c < COLS) cells.push([r, c]) }
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

// ── Gravity ────────────────────────────────────────────────────────────────

function applyGravity(grid: Cell[][]): Cell[][] {
  const g = grid.map(row => row.map(c => ({ ...c })))
  for (let c = 0; c < COLS; c++) {
    const alive = []
    for (let r = 0; r < ROWS; r++) if (g[r][c].alpha > 0.5) alive.push({ ...g[r][c] })
    const newCount = ROWS - alive.length
    const col = [
      ...Array.from({ length: newCount }, () => freshCell()),
      ...alive,
    ]
    for (let r = 0; r < ROWS; r++) {
      g[r][c] = { ...col[r], dy: r < newCount ? -(newCount - r) * TH * 1.5 : 0 }
    }
  }
  return g
}

// ── Swipe → direction ──────────────────────────────────────────────────────
// Divide 360° into 6 sectors of 60° each (aligned with triangle grid axes)
// Right(0°), ↘(60°), ↙(120°), Left(180°), ↖(240°=-120°), ↗(300°=-60°)
function angleToMove(angle: number): { kind: 'row'|'back'|'fwd'; fwd: boolean } {
  // Normalize to 0-360
  const a = ((angle % 360) + 360) % 360
  if (a >= 330 || a < 30)    return { kind: 'row',  fwd: true  }  // → right
  if (a >= 30  && a < 90)    return { kind: 'back', fwd: true  }  // ↘
  if (a >= 90  && a < 150)   return { kind: 'fwd',  fwd: true  }  // ↙
  if (a >= 150 && a < 210)   return { kind: 'row',  fwd: false }  // ← left
  if (a >= 210 && a < 270)   return { kind: 'back', fwd: false }  // ↖
  return                             { kind: 'fwd',  fwd: false }  // ↗
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

// ── Component ──────────────────────────────────────────────────────────────

export default function Trism({ onScoreSubmit }: TrismProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gridRef   = useRef<Cell[][]>(makeGrid())
  const animRef   = useRef(0)
  const busyRef   = useRef(false)
  const scoreRef  = useRef(0)
  const movesRef  = useRef(TOTAL_MOVES)
  const dragRef   = useRef<{ x: number; y: number } | null>(null)
  const selRef    = useRef<{ kind: 'row'|'back'|'fwd'; idx: number } | undefined>(undefined)

  const [gameState, setGameState] = useState<'idle'|'playing'|'dead'>('idle')
  const [score,  setScore]  = useState(0)
  const [moves,  setMoves]  = useState(TOTAL_MOVES)
  const [flashMsg, setFlashMsg] = useState('')

  const redraw = useCallback((flashOn = true) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) drawGrid(ctx, gridRef.current, flashOn, selRef.current)
  }, [])

  useEffect(() => { redraw(); return () => { if (animRef.current) cancelAnimationFrame(animRef.current) } }, [redraw])

  const processMatches = useCallback(async (grid: Cell[][], pts: number): Promise<{ grid: Cell[][]; pts: number }> => {
    const matched = findMatchesRaw(grid)
    if (!matched.size) return { grid, pts }

    // Flash
    const g1 = grid.map(r => r.map(c => ({ ...c })))
    matched.forEach(k => { const [r, c] = k.split(',').map(Number); g1[r][c].flash = true })
    gridRef.current = g1
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
        const t    = Math.min(1, (now - start) / 400)
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

    const newPts  = pts + matched.size * 10
    const combo   = Math.floor(matched.size / 3)
    setFlashMsg(combo > 1 ? `COMBO x${combo}! +${matched.size * 10}` : `+${matched.size * 10}`)
    setTimeout(() => setFlashMsg(''), 1000)

    return processMatches(g3.map(r => r.map(c => ({ ...c, dy: 0 }))), newPts)
  }, [redraw])

  const doMove = useCallback(async (kind: 'row'|'back'|'fwd', idx: number, fwd: boolean) => {
    if (busyRef.current || gameState !== 'playing') return
    const cells = getLineCells(kind, idx)
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
    r: Math.max(0, Math.min(ROWS - 1, Math.floor(y / TH))),
    c: Math.max(0, Math.min(COLS - 1, Math.floor(x / (TW / 2)))),
  })

  const onPointerDown = useCallback((x: number, y: number) => {
    dragRef.current = { x, y }
    const { r, c } = getCell(x, y)
    selRef.current = { kind: 'row', idx: r }
    redraw()
  }, [redraw])

  const onPointerUp = useCallback((x: number, y: number) => {
    if (!dragRef.current) return
    const dx   = x - dragRef.current.x
    const dy   = y - dragRef.current.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const { r, c } = getCell(dragRef.current.x, dragRef.current.y)
    selRef.current = undefined

    if (dist < 20) { dragRef.current = null; redraw(); return }

    const angle = Math.atan2(dy, dx) * 180 / Math.PI
    const { kind, fwd } = angleToMove(angle)
    const idx = kind === 'row' ? r : kind === 'back' ? r - c : r + c

    dragRef.current = null
    redraw()
    doMove(kind, idx, fwd)
  }, [doMove, redraw])

  const mDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return
    onPointerDown(e.clientX - rect.left, e.clientY - rect.top)
  }, [onPointerDown])

  const mUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return
    onPointerUp(e.clientX - rect.left, e.clientY - rect.top)
  }, [onPointerUp])

  const tStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return
    const t = e.touches[0]
    onPointerDown(t.clientX - rect.left, t.clientY - rect.top)
  }, [onPointerDown])

  const tEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return
    const t = e.changedTouches[0]
    onPointerUp(t.clientX - rect.left, t.clientY - rect.top)
  }, [onPointerUp])

  const startGame = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    busyRef.current = false
    scoreRef.current = 0
    movesRef.current = TOTAL_MOVES
    selRef.current   = undefined
    gridRef.current  = makeGrid()
    setScore(0); setMoves(TOTAL_MOVES); setFlashMsg('')
    setGameState('playing')
    setTimeout(redraw, 30)
  }, [redraw])

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-8 w-full justify-between">
        <span className="vt323 text-2xl glow-cyan">SCORE: {score}</span>
        <span className="vt323 text-2xl" style={{ color: moves <= 5 ? 'var(--neon-pink)' : 'var(--neon-green)' }}>
          MOVES: {moves}
        </span>
      </div>

      <div style={{ minHeight: '26px' }}>
        {flashMsg && <p className="glow-yellow" style={{ fontFamily: 'Press Start 2P', fontSize: '11px', textAlign: 'center' }}>{flashMsg}</p>}
      </div>

      <div className="relative" style={{ userSelect: 'none', touchAction: 'none' }}>
        <canvas
          ref={canvasRef} width={CW} height={CH}
          style={{ display: 'block', border: '2px solid var(--neon-cyan)', boxShadow: '0 0 12px var(--neon-cyan)', cursor: gameState === 'playing' ? 'crosshair' : 'default', maxWidth: '100%' }}
          onMouseDown={gameState === 'playing' ? mDown : undefined}
          onMouseUp={gameState === 'playing' ? mUp : undefined}
          onMouseLeave={() => { dragRef.current = null; selRef.current = undefined; redraw() }}
          onTouchStart={gameState === 'playing' ? tStart : undefined}
          onTouchEnd={gameState === 'playing' ? tEnd : undefined}
        />

        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 gap-4">
            <p className="glow-cyan" style={{ fontFamily: 'Press Start 2P', fontSize: '14px' }}>TRISM</p>
            <p className="vt323 text-center px-6" style={{ color: 'var(--neon-green)', fontSize: '20px', maxWidth: '320px', lineHeight: '1.6' }}>
              Swipe to slide lines of triangles.<br />Match 3+ of the same color!
            </p>
            <div className="vt323 text-center" style={{ color: 'rgba(0,255,255,0.65)', fontSize: '17px', lineHeight: 1.8 }}>
              ← → swipe = slide row<br />
              ↘ ↖ swipe = slide \\ diagonal<br />
              ↙ ↗ swipe = slide / diagonal
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
        Swipe ← → for rows · ↘↖ or ↙↗ for diagonals
      </p>
    </div>
  )
}
