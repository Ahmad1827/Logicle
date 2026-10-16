import { useEffect, useMemo, useState } from 'react'
import { createRng } from '../../lib/random.js'
import { EraseIcon, PencilIcon } from '../../icons.jsx'
import { generateFutoshiki, SIZE } from './generate.js'

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

export default function Futoshiki({ seed, solved, onSolve }) {
  const { solution, givens, signs } = useMemo(() => generateFutoshiki(createRng(seed)), [seed])
  const [grid, setGrid] = useState(givens)
  const [notes, setNotes] = useState(() => Array(N * N).fill(0))
  const [noteMode, setNoteMode] = useState(false)
  const [selected, setSelected] = useState(() => Math.max(0, givens.indexOf(0)))
  const bad = lineConflicts(grid)

  // Sign between a cell and its right / lower neighbour, keyed by the pair.
  const signAt = new Map()
  for (const s of signs) {
    const [lo, hi] = s.a < s.b ? [s.a, s.b] : [s.b, s.a]
    const broken = grid[s.a] && grid[s.b] && grid[s.a] >= grid[s.b]
    const horizontal = hi === lo + 1
    // The sign points at the smaller number.
    const text = horizontal ? (s.a === lo ? '<' : '>') : s.a === lo ? '∧' : '∨'
    signAt.set(`${lo}-${hi}`, { text, broken })
  }

  function enter(value) {
    if (solved || givens[selected]) return
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

  const selRow = Math.floor(selected / N)
  const selCol = selected % N
  const items = []
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const i = r * N + c
      const v = grid[i]
      const classes = ['cell']
      if (givens[i]) classes.push('given')
      if (i === selected) classes.push('selected')
      else if (r === selRow || c === selCol) classes.push('related')
      if (bad.has(i)) classes.push('error')
      items.push(
        <button key={i} className={classes.join(' ')} onClick={() => setSelected(i)}>
          {v ? (
            v
          ) : notes[i] ? (
            <span className="notes">
              {Array.from({ length: N }, (_, k) => (
                <span key={k}>{notes[i] & (1 << (k + 1)) ? k + 1 : ''}</span>
              ))}
            </span>
          ) : null}
        </button>,
      )
      if (c < N - 1) {
        const s = signAt.get(`${i}-${i + 1}`)
        items.push(
          <span key={`h${i}`} className={`sign ${s?.broken ? 'broken' : ''}`}>
            {s?.text}
          </span>,
        )
      }
    }
    if (r < N - 1) {
      for (let c = 0; c < N; c++) {
        const i = r * N + c
        const s = signAt.get(`${i}-${i + N}`)
        items.push(
          <span key={`v${i}`} className={`sign ${s?.broken ? 'broken' : ''}`}>
            {s?.text}
          </span>,
        )
        if (c < N - 1) items.push(<span key={`g${i}`} />)
      }
    }
  }

  return (
    <div className="stack">
      <div className="board futoshiki" style={{ '--cols': (4 * N - 1) / 3, '--rows': (4 * N - 1) / 3 }}>
        {items}
      </div>
      <div className="keypad" style={{ '--keys': N }}>
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
