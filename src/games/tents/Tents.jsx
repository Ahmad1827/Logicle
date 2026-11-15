import { useMemo } from 'react'
import GameControls from '../../GameControls.jsx'
import { useFlash } from '../../lib/hint.js'
import { useHistory } from '../../lib/history.js'
import { createRng } from '../../lib/random.js'
import { DotIcon, TentIcon, TreeIcon } from '../../icons.jsx'
import { around, generateTents, SIZE } from './generate.js'

const N = SIZE
const EMPTY = 0
const GRASS = 1
const TENT = 2

export default function Tents({ seed, solved, onSolve, onHint, onRandomize }) {
  const { trees, tents, rows, cols } = useMemo(() => generateTents(createRng(seed)), [seed])
  const history = useHistory(() => Array(N * N).fill(EMPTY))
  const cells = history.present
  const isTent = (i) => cells[i] === TENT
  const touching = new Set(cells.flatMap((v, i) => (v === TENT && around(i).some(isTent) ? [i] : [])))
  const rowTents = rows.map((_, r) => cells.slice(r * N, r * N + N).filter((v) => v === TENT).length)
  const colTents = cols.map((_, c) => cells.filter((v, i) => i % N === c && v === TENT).length)
  const [flashed, flash] = useFlash()
  const clueState = (have, want) => (have > want ? 'over' : have === want ? 'done' : '')

  function tap(i) {
    if (solved || trees.has(i)) return
    const next = [...cells]
    next[i] = (next[i] + 1) % 3
    update(next)
  }

  function update(next) {
    history.commit(next)
    if (next.every((v, k) => (v === TENT) === tents.has(k))) onSolve()
  }

  // Fixes a wrong tent or grass mark, otherwise pitches a tent in the row closest to finished.
  function hint() {
    if (solved) return
    let i = cells.findIndex((v, k) => v !== EMPTY && (v === TENT) !== tents.has(k))
    if (i < 0) {
      const missing = [...tents].filter((k) => cells[k] !== TENT)
      if (!missing.length) return
      const left = (k) => rows[Math.floor(k / N)] - rowTents[Math.floor(k / N)]
      i = missing.reduce((best, k) => (left(k) < left(best) ? k : best))
    }
    const next = [...cells]
    next[i] = tents.has(i) ? TENT : GRASS
    update(next)
    flash(i)
    onHint()
  }

  return (
    <div className="stack">
      <div className="board tents" style={{ '--cols': N + 1, '--rows': N + 1 }}>
        <span />
        {cols.map((n, c) => (
          <span key={c} className={`count ${clueState(colTents[c], n)}`}>
            {n}
          </span>
        ))}
        {rows.map((n, r) => [
          <span key={`r${r}`} className={`count ${clueState(rowTents[r], n)}`}>
            {n}
          </span>,
          ...Array.from({ length: N }, (_, c) => {
            const i = r * N + c
            const v = cells[i]
            return (
              <button
                key={i}
                className={`cell ${trees.has(i) ? 'tree' : v === GRASS ? 'grass' : ''} ${touching.has(i) ? 'error' : ''} ${flashed === i ? 'hinted' : ''}`}
                onClick={() => tap(i)}
              >
                {trees.has(i) ? <TreeIcon /> : v === TENT ? <TentIcon /> : v === GRASS ? <DotIcon /> : null}
              </button>
            )
          }),
        ])}
      </div>
      <GameControls history={history} locked={solved} onHint={hint} onRandomize={onRandomize} />
    </div>
  )
}
