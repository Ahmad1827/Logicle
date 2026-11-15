import { useEffect, useMemo, useRef, useState } from 'react'
import GameControls from '../../GameControls.jsx'
import { useFlash } from '../../lib/hint.js'
import { useHistory } from '../../lib/history.js'
import { createRng } from '../../lib/random.js'
import { CrossIcon, SquareIcon } from '../../icons.jsx'
import { generateNonogram, lineClue, SIZE } from './generate.js'

const EMPTY = 0
const FILLED = 1
const MARKED = 2

export default function Nonogram({ seed, solved, onSolve, onHint, onRandomize }) {
  const { solution, rowClues, colClues } = useMemo(() => generateNonogram(createRng(seed)), [seed])
  const history = useHistory(() => Array.from({ length: SIZE }, () => Array(SIZE).fill(EMPTY)))
  const grid = history.present
  const [markMode, setMarkMode] = useState(false)
  const paint = useRef(null) // the drag in progress; also its undo group
  const [flashed, flash] = useFlash()

  const done = (line, clue) => lineClue(line.map((v) => (v === FILLED ? 1 : 0))).join() === clue.join()
  const rowDone = rowClues.map((clue, r) => done(grid[r], clue))
  const colDone = colClues.map((clue, c) => done(grid.map((row) => row[c]), clue))
  // Finished lines cross out their empty squares. This is worked out from the
  // board rather than stored, so the crosses vanish if the line is changed again.
  const crossed = (r, c) => grid[r][c] === MARKED || (grid[r][c] === EMPTY && (rowDone[r] || colDone[c]))

  function setCell(r, c, value, group) {
    history.commit((g) => {
      if (g[r][c] === value) return g
      const next = g.map((row) => [...row])
      next[r][c] = value
      return next
    }, group)
  }

  useEffect(() => {
    if (solved) return
    if (grid.every((row, r) => row.every((v, c) => (v === FILLED) === (solution[r][c] === 1)))) onSolve()
  }, [grid, solution, solved, onSolve])

  // Fixes a wrong square, otherwise fills a square in the line with the least left to fill.
  function hint() {
    if (solved) return
    const want = (r, c) => (solution[r][c] === 1 ? FILLED : MARKED)
    const squares = grid.flatMap((row, r) => row.map((v, c) => [r, c, v]))
    let pick = squares.find(([r, c, v]) => (v === FILLED || v === MARKED) && v !== want(r, c))
    if (!pick) {
      const left = (cells) => cells.filter(([r, c, v]) => v !== FILLED && solution[r][c] === 1).length
      const rowLeft = rowClues.map((_, r) => left(squares.filter((q) => q[0] === r)))
      const colLeft = colClues.map((_, c) => left(squares.filter((q) => q[1] === c)))
      const todo = squares.filter(([r, c, v]) => v !== FILLED && solution[r][c] === 1)
      if (!todo.length) return
      const cost = ([r, c]) => Math.min(rowLeft[r], colLeft[c])
      pick = todo.reduce((best, q) => (cost(q) < cost(best) ? q : best))
    }
    const [r, c] = pick
    setCell(r, c, want(r, c))
    flash(`${r}-${c}`)
    onHint()
  }

  function startPaint(e, r, c, mark) {
    if (solved) return
    e.preventDefault()
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    const isSet = mark ? crossed(r, c) : grid[r][c] === FILLED
    paint.current = { value: isSet ? EMPTY : mark ? MARKED : FILLED }
    setCell(r, c, paint.current.value, paint.current)
  }

  function dragOver(r, c) {
    const drag = paint.current
    if (!drag || solved) return
    // A fill drag passes over crossed squares; tap one to fill it on purpose.
    if (drag.value === FILLED && crossed(r, c)) return
    setCell(r, c, drag.value, drag)
  }

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
            <div key={c} className={`clue ${colDone[c] ? 'done' : ''}`}>
              {clue.map((n, k) => (
                <span key={k}>{n}</span>
              ))}
            </div>
          ))}
        </div>
        <div className="row-clues">
          {rowClues.map((clue, r) => (
            <div key={r} className={`clue ${rowDone[r] ? 'done' : ''}`}>
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
                className={`cell ${v === FILLED ? 'filled' : ''} ${c % 5 === 4 && c < SIZE - 1 ? 'edge-right' : ''} ${r % 5 === 4 && r < SIZE - 1 ? 'edge-bottom' : ''} ${flashed === `${r}-${c}` ? 'hinted' : ''}`}
                onPointerDown={(e) => startPaint(e, r, c, markMode || e.button === 2)}
                onPointerEnter={() => dragOver(r, c)}
                onContextMenu={(e) => e.preventDefault()}
              >
                {crossed(r, c) && <CrossIcon />}
              </div>
            )),
          )}
        </div>
      </div>
      <GameControls history={history} locked={solved} onHint={hint} onRandomize={onRandomize} />
    </div>
  )
}
