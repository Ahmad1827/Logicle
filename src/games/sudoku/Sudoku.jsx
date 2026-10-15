import { useEffect, useMemo, useState } from 'react'
import { createRng } from '../../lib/random.js'
import { generateSudoku, N, BOX_ROWS, BOX_COLS } from './generate.js'

function conflicts(grid) {
  const bad = new Set()
  for (let i = 0; i < N * N; i++) {
    if (!grid[i]) continue
    for (let j = i + 1; j < N * N; j++) {
      if (grid[i] !== grid[j]) continue
      const [ri, ci, rj, cj] = [Math.floor(i / N), i % N, Math.floor(j / N), j % N]
      const sameBox =
        Math.floor(ri / BOX_ROWS) === Math.floor(rj / BOX_ROWS) &&
        Math.floor(ci / BOX_COLS) === Math.floor(cj / BOX_COLS)
      if (ri === rj || ci === cj || sameBox) bad.add(i).add(j)
    }
  }
  return bad
}

export default function Sudoku({ seed, solved, onSolve }) {
  const { puzzle, solution } = useMemo(() => generateSudoku(createRng(seed)), [seed])
  const [grid, setGrid] = useState(puzzle)
  const [selected, setSelected] = useState(puzzle.indexOf(0))
  const bad = conflicts(grid)

  function enter(value) {
    if (solved || selected < 0 || puzzle[selected]) return
    const next = [...grid]
    next[selected] = value
    setGrid(next)
    if (next.every((v, i) => v === solution[i])) onSolve()
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key >= '1' && e.key <= String(N)) enter(Number(e.key))
      else if (['Backspace', 'Delete', '0'].includes(e.key)) enter(0)
      else {
        const move = { ArrowUp: -N, ArrowDown: N, ArrowLeft: -1, ArrowRight: 1 }[e.key]
        if (move === undefined) return
        e.preventDefault()
        setSelected((s) => Math.min(N * N - 1, Math.max(0, s + move)))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const selRow = Math.floor(selected / N)
  const selCol = selected % N

  return (
    <div className="stack">
      <div className="board sudoku" style={{ '--cols': N }}>
        {grid.map((v, i) => {
          const r = Math.floor(i / N)
          const c = i % N
          const classes = ['cell']
          if (puzzle[i]) classes.push('given')
          if (i === selected) classes.push('selected')
          else if (r === selRow || c === selCol) classes.push('related')
          else if (v && v === grid[selected]) classes.push('related')
          if (bad.has(i)) classes.push('error')
          if (c % BOX_COLS === BOX_COLS - 1 && c < N - 1) classes.push('edge-right')
          if (r % BOX_ROWS === BOX_ROWS - 1 && r < N - 1) classes.push('edge-bottom')
          return (
            <button key={i} className={classes.join(' ')} onClick={() => setSelected(i)}>
              {v || ''}
            </button>
          )
        })}
      </div>
      <div className="keypad">
        {Array.from({ length: N }, (_, k) => (
          <button key={k} onClick={() => enter(k + 1)} disabled={solved}>
            {k + 1}
          </button>
        ))}
        <button onClick={() => enter(0)} disabled={solved}>
          ⌫
        </button>
      </div>
    </div>
  )
}
