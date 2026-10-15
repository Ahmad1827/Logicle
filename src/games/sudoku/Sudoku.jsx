import { useEffect, useMemo, useState } from 'react'
import { createRng } from '../../lib/random.js'
import { EraseIcon, PencilIcon } from '../../icons.jsx'
import { generateSudoku, N, BOX, PEERS } from './generate.js'

function conflicts(grid) {
  const bad = new Set()
  grid.forEach((v, i) => {
    if (v && PEERS[i].some((p) => grid[p] === v)) bad.add(i)
  })
  return bad
}

export default function Sudoku({ seed, solved, onSolve }) {
  const { puzzle, solution } = useMemo(() => generateSudoku(createRng(seed)), [seed])
  const [grid, setGrid] = useState(puzzle)
  const [notes, setNotes] = useState(() => Array(N * N).fill(0)) // bitmask of pencil marks
  const [noteMode, setNoteMode] = useState(false)
  const [selected, setSelected] = useState(puzzle.indexOf(0))
  const bad = conflicts(grid)

  function enter(value) {
    if (solved || selected < 0 || puzzle[selected]) return
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
    // Placing a number clears that number from the notes of every cell it sees.
    if (value) PEERS[selected].forEach((p) => (nextNotes[p] &= ~(1 << value)))
    setNotes(nextNotes)
    if (nextGrid.every((v, i) => v === solution[i])) onSolve()
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key >= '1' && e.key <= '9') enter(Number(e.key))
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
  const selBox = Math.floor(selRow / BOX) * BOX + Math.floor(selCol / BOX)
  const selValue = grid[selected]

  return (
    <div className="stack">
      <div className="board sudoku" style={{ '--cols': N, '--rows': N }}>
        {grid.map((v, i) => {
          const r = Math.floor(i / N)
          const c = i % N
          const box = Math.floor(r / BOX) * BOX + Math.floor(c / BOX)
          const classes = ['cell']
          if (puzzle[i]) classes.push('given')
          if (i === selected) classes.push('selected')
          else if (v && v === selValue) classes.push('same')
          else if (r === selRow || c === selCol || box === selBox) classes.push('related')
          if (bad.has(i)) classes.push('error')
          if (c % BOX === BOX - 1 && c < N - 1) classes.push('edge-right')
          if (r % BOX === BOX - 1 && r < N - 1) classes.push('edge-bottom')
          return (
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
