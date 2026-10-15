import { useMemo, useState } from 'react'
import { createRng } from '../../lib/random.js'
import { generateTakuzu, SIZE } from './generate.js'

const N = SIZE
const EMPTY = -1

// Cells that break a rule: three in a row, too many of one colour in a line,
// or a finished line identical to another one.
function findErrors(grid) {
  const bad = new Set()
  const lines = []
  for (let k = 0; k < N; k++) {
    lines.push(Array.from({ length: N }, (_, j) => k * N + j))
    lines.push(Array.from({ length: N }, (_, j) => j * N + k))
  }
  for (const line of lines) {
    for (let j = 2; j < N; j++) {
      const [a, b, c] = [line[j - 2], line[j - 1], line[j]]
      if (grid[a] !== EMPTY && grid[a] === grid[b] && grid[b] === grid[c]) [a, b, c].forEach((i) => bad.add(i))
    }
    for (const v of [0, 1]) {
      const cells = line.filter((i) => grid[i] === v)
      if (cells.length > N / 2) cells.forEach((i) => bad.add(i))
    }
  }
  for (let a = 0; a < lines.length; a++) {
    for (let b = a + 2; b < lines.length; b += 2) {
      const la = lines[a].map((i) => grid[i])
      const lb = lines[b].map((i) => grid[i])
      if (!la.includes(EMPTY) && la.join() === lb.join()) [...lines[a], ...lines[b]].forEach((i) => bad.add(i))
    }
  }
  return bad
}

export default function Takuzu({ seed, solved, onSolve }) {
  const { puzzle, solution } = useMemo(() => generateTakuzu(createRng(seed)), [seed])
  const [grid, setGrid] = useState(puzzle)
  const bad = findErrors(grid)

  function tap(i) {
    if (solved || puzzle[i] !== EMPTY) return
    const next = [...grid]
    next[i] = next[i] === EMPTY ? 0 : next[i] === 0 ? 1 : EMPTY
    setGrid(next)
    if (next.every((v, k) => v === solution[k])) onSolve()
  }

  return (
    <div className="stack">
      <div className="board takuzu" style={{ '--cols': N, '--rows': N }}>
        {grid.map((v, i) => (
          <button
            key={i}
            className={`cell ${puzzle[i] !== EMPTY ? 'given' : ''} ${bad.has(i) ? 'error' : ''}`}
            onClick={() => tap(i)}
          >
            {v !== EMPTY && <span className={`disc d${v}`} />}
          </button>
        ))}
      </div>
    </div>
  )
}
