import { useMemo } from 'react'
import GameControls from '../../GameControls.jsx'
import { useFlash } from '../../lib/hint.js'
import { useHistory } from '../../lib/history.js'
import { createRng } from '../../lib/random.js'
import { CrossIcon, CrownIcon } from '../../icons.jsx'
import { generateQueens, SIZE } from './generate.js'

const COLORS = ['#ff9a8b', '#7ec4ff', '#9be58e', '#ffd65c', '#c8a2ff', '#ffb870', '#6fe0cf', '#f5a3d0']
const EMPTY = 0
const MARK = 1
const QUEEN = 2

function findConflicts(cells, regions) {
  const queens = []
  cells.forEach((v, i) => v === QUEEN && queens.push(i))
  const bad = new Set()
  for (const a of queens) {
    for (const b of queens) {
      if (a >= b) continue
      const [ra, ca, rb, cb] = [Math.floor(a / SIZE), a % SIZE, Math.floor(b / SIZE), b % SIZE]
      const touching = Math.abs(ra - rb) <= 1 && Math.abs(ca - cb) <= 1
      if (ra === rb || ca === cb || regions[a] === regions[b] || touching) bad.add(a).add(b)
    }
  }
  return { queens, bad }
}

export default function Queens({ seed, solved, onSolve, onHint, onRandomize }) {
  const { regions, queens } = useMemo(() => generateQueens(createRng(seed)), [seed])
  const history = useHistory(() => Array(SIZE * SIZE).fill(EMPTY))
  const cells = history.present
  const { bad } = findConflicts(cells, regions)
  const [flashed, flash] = useFlash()
  const answer = new Set(queens.map((c, r) => r * SIZE + c))

  function tap(i) {
    if (solved) return
    const next = [...cells]
    next[i] = (next[i] + 1) % 3
    update(next)
  }

  // Takes away a wrong queen or cross, otherwise crowns the region with the least room left.
  function hint() {
    if (solved) return
    let i = cells.findIndex((v, j) => (v === QUEEN) !== answer.has(j) && v !== EMPTY)
    if (i < 0) {
      const room = (j) => cells.filter((v, k) => regions[k] === regions[j] && v === EMPTY).length
      const missing = [...answer].filter((j) => cells[j] !== QUEEN)
      if (!missing.length) return
      i = missing.reduce((best, j) => (room(j) < room(best) ? j : best))
    }
    const next = [...cells]
    next[i] = answer.has(i) ? QUEEN : MARK
    update(next)
    flash(i)
    onHint()
  }

  function update(next) {
    history.commit(next)
    const result = findConflicts(next, regions)
    if (result.queens.length === SIZE && result.bad.size === 0) onSolve()
  }

  const border = (i, n) => (n === null || regions[n] !== regions[i] ? '2px solid #1f1d24' : '1px solid rgba(0, 0, 0, 0.12)')

  return (
    <div className="stack">
      <div className="board queens" style={{ '--cols': SIZE, '--rows': SIZE }}>
        {cells.map((v, i) => {
          const r = Math.floor(i / SIZE)
          const c = i % SIZE
          return (
            <button
              key={i}
              className={`cell ${bad.has(i) ? 'error' : ''} ${flashed === i ? 'hinted' : ''}`}
              style={{
                background: COLORS[regions[i]],
                borderTop: border(i, r > 0 ? i - SIZE : null),
                borderBottom: border(i, r < SIZE - 1 ? i + SIZE : null),
                borderLeft: border(i, c > 0 ? i - 1 : null),
                borderRight: border(i, c < SIZE - 1 ? i + 1 : null),
              }}
              onClick={() => tap(i)}
            >
              {v === QUEEN ? <CrownIcon /> : v === MARK ? <CrossIcon /> : null}
            </button>
          )
        })}
      </div>
      <GameControls history={history} locked={solved} onHint={hint} onRandomize={onRandomize} />
    </div>
  )
}
