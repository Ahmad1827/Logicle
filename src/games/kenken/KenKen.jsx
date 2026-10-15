import { useEffect, useMemo, useState } from 'react'
import { createRng } from '../../lib/random.js'
import { EraseIcon, PencilIcon } from '../../icons.jsx'
import { cageSatisfied, generateKenKen, SIZE } from './generate.js'

const N = SIZE

function lineConflicts(grid) {
  const bad = new Set()
  for (let i = 0; i < N * N; i++) {
    if (!grid[i]) continue
    const r = Math.floor(i / N)
    const c = i % N
    for (let k = 0; k < N; k++) {
      if (k !== c && grid[r * N + k] === grid[i]) bad.add(i)
      if (k !== r && grid[k * N + c] === grid[i]) bad.add(i)
    }
  }
  return bad
}

export default function KenKen({ seed, solved, onSolve }) {
  const { solution, cages, cageOf } = useMemo(() => generateKenKen(createRng(seed)), [seed])
  const [grid, setGrid] = useState(() => Array(N * N).fill(0))
  const [notes, setNotes] = useState(() => Array(N * N).fill(0))
  const [noteMode, setNoteMode] = useState(false)
  const [selected, setSelected] = useState(0)
  const bad = lineConflicts(grid)
  const labelCell = cages.map((cage) => Math.min(...cage.cells))
  const wrongCages = new Set(
    cages
      .map((cage, k) => [k, cage.cells.map((i) => grid[i])])
      .filter(([k, values]) => values.every(Boolean) && !cageSatisfied(cages[k], values))
      .map(([k]) => k),
  )

  function enter(value) {
    if (solved) return
    if (noteMode && value) {
      if (grid[selected]) return
      const next = [...notes]
      next[selected] ^= 1 << value
      setNotes(next)
      return
    }
    const nextGrid = [...grid]
    nextGrid[selected] = value
    setGrid(nextGrid)
    const nextNotes = [...notes]
    nextNotes[selected] = 0
    if (value) {
      const r = Math.floor(selected / N)
      const c = selected % N
      for (let k = 0; k < N; k++) {
        nextNotes[r * N + k] &= ~(1 << value)
        nextNotes[k * N + c] &= ~(1 << value)
      }
    }
    setNotes(nextNotes)
    if (nextGrid.every((v, i) => v === solution[i])) onSolve()
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key >= '1' && e.key <= String(N)) enter(Number(e.key))
      else if (['Backspace', 'Delete', '0'].includes(e.key)) enter(0)
      else if (e.key === 'n' || e.key === 'N') setNoteMode((m) => !m)
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

  const cageEdge = (i, n) => (n === null || cageOf[n] !== cageOf[i] ? '2.5px solid var(--line-strong)' : '1px solid var(--line)')
  const selRow = Math.floor(selected / N)
  const selCol = selected % N

  return (
    <div className="stack">
      <div className="board kenken" style={{ '--cols': N, '--rows': N }}>
        {grid.map((v, i) => {
          const r = Math.floor(i / N)
          const c = i % N
          const cage = cages[cageOf[i]]
          const classes = ['cell']
          if (i === selected) classes.push('selected')
          else if (r === selRow || c === selCol) classes.push('related')
          if (bad.has(i)) classes.push('error')
          return (
            <button
              key={i}
              className={classes.join(' ')}
              style={{
                borderTop: r > 0 ? cageEdge(i, i - N) : 'none',
                borderLeft: c > 0 ? cageEdge(i, i - 1) : 'none',
              }}
              onClick={() => setSelected(i)}
            >
              {labelCell[cageOf[i]] === i && (
                <span className={`cage-label ${wrongCages.has(cageOf[i]) ? 'wrong' : ''}`}>
                  {cage.target}
                  {cage.op}
                </span>
              )}
              {v ? (
                v
              ) : notes[i] ? (
                <span className="notes">
                  {Array.from({ length: N }, (_, k) => (
                    <span key={k}>{notes[i] & (1 << (k + 1)) ? k + 1 : ''}</span>
                  ))}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
      <div className="keypad" style={{ gridTemplateColumns: `repeat(${N}, 1fr)` }}>
        {Array.from({ length: N }, (_, k) => (
          <button key={k} onClick={() => enter(k + 1)} disabled={solved}>
            {k + 1}
          </button>
        ))}
      </div>
      <div className="tools">
        <button className={noteMode ? 'active' : ''} onClick={() => setNoteMode((m) => !m)} disabled={solved}>
          <PencilIcon /> Notes
        </button>
        <button onClick={() => enter(0)} disabled={solved}>
          <EraseIcon /> Erase
        </button>
      </div>
    </div>
  )
}
