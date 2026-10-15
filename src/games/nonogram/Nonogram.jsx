import { useEffect, useMemo, useRef, useState } from 'react'
import { createRng } from '../../lib/random.js'
import { CrossIcon, SquareIcon } from '../../icons.jsx'
import { generateNonogram, lineClue, SIZE } from './generate.js'

const EMPTY = 0
const FILLED = 1
const MARKED = 2

export default function Nonogram({ seed, solved, onSolve }) {
  const { solution, rowClues, colClues } = useMemo(() => generateNonogram(createRng(seed)), [seed])
  const [grid, setGrid] = useState(() => Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY)))
  const [markMode, setMarkMode] = useState(false)
  const paint = useRef(null) // value being painted while dragging

  function setCell(r, c, value) {
    setGrid((g) => {
      if (g[r][c] === value) return g
      const next = g.map((row) => [...row])
      next[r][c] = value
      return next
    })
  }

  useEffect(() => {
    if (solved) return
    if (grid.every((row, r) => row.every((v, c) => (v === FILLED) === (solution[r][c] === 1)))) onSolve()
  }, [grid, solution, solved, onSolve])

  function startPaint(e, r, c, mark) {
    if (solved) return
    e.preventDefault()
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    const target = mark ? MARKED : FILLED
    paint.current = grid[r][c] === target ? EMPTY : target
    setCell(r, c, paint.current)
  }

  const done = (line, clue) => lineClue(line.map((v) => (v === FILLED ? 1 : 0))).join() === clue.join()

  return (
    <div className="stack">
      <div className="toolbar">
        <span />
        <div className="toggle">
          <button className={!markMode ? 'active' : ''} onClick={() => setMarkMode(false)} aria-label="Fill">
            <SquareIcon />
          </button>
          <button className={markMode ? 'active' : ''} onClick={() => setMarkMode(true)} aria-label="Mark">
            <CrossIcon />
          </button>
        </div>
      </div>
      <div className="nonogram" style={{ '--cols': SIZE, '--rows': SIZE }}>
        <div />
        <div className="col-clues">
          {colClues.map((clue, c) => (
            <div key={c} className={`clue ${done(grid.map((row) => row[c]), clue) ? 'done' : ''}`}>
              {clue.map((n, k) => (
                <span key={k}>{n}</span>
              ))}
            </div>
          ))}
        </div>
        <div className="row-clues">
          {rowClues.map((clue, r) => (
            <div key={r} className={`clue ${done(grid[r], clue) ? 'done' : ''}`}>
              {clue.map((n, k) => (
                <span key={k}>{n}</span>
              ))}
            </div>
          ))}
        </div>
        <div
          className="board nonogram-grid"
          onPointerUp={() => (paint.current = null)}
          onPointerLeave={() => (paint.current = null)}
        >
          {grid.map((row, r) =>
            row.map((v, c) => (
              <div
                key={`${r}-${c}`}
                className={`cell ${v === FILLED ? 'filled' : ''} ${c % 5 === 4 && c < SIZE - 1 ? 'edge-right' : ''} ${r % 5 === 4 && r < SIZE - 1 ? 'edge-bottom' : ''}`}
                onPointerDown={(e) => startPaint(e, r, c, markMode || e.button === 2)}
                onPointerEnter={() => paint.current !== null && !solved && setCell(r, c, paint.current)}
                onContextMenu={(e) => e.preventDefault()}
              >
                {v === MARKED && <CrossIcon />}
              </div>
            )),
          )}
        </div>
      </div>
    </div>
  )
}
