import { useEffect, useMemo, useState } from 'react'
import GameControls from '../../GameControls.jsx'
import { useActive } from '../../lib/active.js'
import { useHistory } from '../../lib/history.js'
import { linePeers, pickNumberHint, useFlash } from '../../lib/hint.js'
import { createRng, range } from '../../lib/random.js'
import { EraseIcon, PencilIcon } from '../../icons.jsx'
import { generateSkyscrapers, SIZE, visible } from './generate.js'

const N = SIZE
const LINE_PEERS = linePeers(N)

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

// A clue is checked once its line is full: faded when it holds, red when it doesn't.
function clueState(clue, line) {
  if (!clue || line.some((v) => !v)) return ''
  return visible(line) === clue ? 'done' : 'over'
}

export default function Skyscrapers({ seed, solved, onSolve, onHint, onRandomize }) {
  const { solution, givens, clues } = useMemo(() => generateSkyscrapers(createRng(seed)), [seed])
  const history = useHistory(() => ({ grid: givens, notes: Array(N * N).fill(0) }))
  const { grid, notes } = history.present
  const [noteMode, setNoteMode] = useState(false)
  const [flashed, flash] = useFlash()
  const active = useActive()
  const [selected, setSelected] = useState(() => Math.max(0, givens.indexOf(0)))
  const bad = lineConflicts(grid)

  const row = (r) => range(N).map((c) => grid[r * N + c])
  const col = (c) => range(N).map((r) => grid[r * N + c])

  function enter(value) {
    if (solved || givens[selected]) return
    if (noteMode && value) {
      if (grid[selected]) return
      const next = [...notes]
      next[selected] ^= 1 << value
      history.commit({ grid, notes: next })
      return
    }
    write(selected, value)
  }

  function write(i, value) {
    const nextGrid = [...grid]
    nextGrid[i] = value
    const nextNotes = [...notes]
    nextNotes[i] = 0
    if (value) {
      const r = Math.floor(i / N)
      const c = i % N
      for (let k = 0; k < N; k++) {
        nextNotes[r * N + k] &= ~(1 << value)
        nextNotes[k * N + c] &= ~(1 << value)
      }
    }
    history.commit({ grid: nextGrid, notes: nextNotes })
    if (nextGrid.every((v, i) => v === solution[i])) onSolve()
  }

  // Fixes a wrong number, or fills in the square with the fewest options left.
  function hint() {
    if (solved) return
    const i = pickNumberHint({ grid, solution, fixed: givens, selected, peers: LINE_PEERS, size: N })
    if (i < 0) return
    setSelected(i)
    write(i, solution[i])
    flash(i)
    onHint()
  }

  useEffect(() => {
    if (!active) return
    function onKey(e) {
      if (e.ctrlKey || e.metaKey) return
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

  const clue = (value, line, key) => (
    <span key={key} className={`count ${clueState(value, line)}`}>
      {value || ''}
    </span>
  )

  const selRow = Math.floor(selected / N)
  const selCol = selected % N
  const items = [<span key="tl" />, ...clues.top.map((v, c) => clue(v, col(c), `t${c}`)), <span key="tr" />]
  for (let r = 0; r < N; r++) {
    items.push(clue(clues.left[r], row(r), `l${r}`))
    for (let c = 0; c < N; c++) {
      const i = r * N + c
      const classes = ['cell']
      if (givens[i]) classes.push('given')
      if (i === selected) classes.push('selected')
      else if (r === selRow || c === selCol) classes.push('related')
      if (bad.has(i)) classes.push('error')
      if (flashed === i) classes.push('hinted')
      items.push(
        <button key={i} className={classes.join(' ')} onClick={() => setSelected(i)}>
          {grid[i] ? (
            grid[i]
          ) : notes[i] ? (
            <span className="notes">
              {range(N).map((k) => (
                <span key={k}>{notes[i] & (1 << (k + 1)) ? k + 1 : ''}</span>
              ))}
            </span>
          ) : null}
        </button>,
      )
    }
    items.push(clue(clues.right[r], [...row(r)].reverse(), `r${r}`))
  }
  items.push(<span key="bl" />, ...clues.bottom.map((v, c) => clue(v, col(c).reverse(), `b${c}`)), <span key="br" />)

  return (
    <div className="stack">
      <div className="board skyscrapers" style={{ '--cols': N + 2, '--rows': N + 2 }}>
        {items}
      </div>
      <div className="keypad" style={{ '--keys': N }}>
        {range(N).map((k) => (
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
      <GameControls history={history} locked={solved} onHint={hint} onRandomize={onRandomize} />
    </div>
  )
}
