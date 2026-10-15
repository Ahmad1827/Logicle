import { useMemo, useState } from 'react'
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

export default function Queens({ seed, solved, onSolve }) {
  const { regions } = useMemo(() => generateQueens(createRng(seed)), [seed])
  const [cells, setCells] = useState(() => Array(SIZE * SIZE).fill(EMPTY))
  const { bad } = findConflicts(cells, regions)

  function tap(i) {
    if (solved) return
    const next = [...cells]
    next[i] = (next[i] + 1) % 3
    setCells(next)
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
              className={`cell ${bad.has(i) ? 'error' : ''}`}
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
    </div>
  )
}
