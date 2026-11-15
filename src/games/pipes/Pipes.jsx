import { useMemo } from 'react'
import GameControls from '../../GameControls.jsx'
import { useFlash } from '../../lib/hint.js'
import { useHistory } from '../../lib/history.js'
import { createRng, range } from '../../lib/random.js'
import { across, degree, flow, generatePipes, isSolved, rotate, SIDES, SIZE, SOURCE } from './generate.js'

const N = SIZE
// Each side's pipe as a line from the centre of a 100×100 tile.
const ARMS = [
  [1, 'M50 50V0'],
  [2, 'M50 50H100'],
  [4, 'M50 50V100'],
  [8, 'M50 50H0'],
]

export default function Pipes({ seed, solved, onSolve, onHint, onRandomize }) {
  const { tiles, solution } = useMemo(() => generatePipes(createRng(seed)), [seed])
  // Quarter turns per tile. They keep counting past 4 so the turn animation never spins backwards.
  const history = useHistory(() => Array(N * N).fill(0))
  const turns = history.present
  const masks = tiles.map((m, i) => rotate(m, turns[i]))
  const wet = flow(masks)
  const [flashed, flash] = useFlash()

  function update(next) {
    history.commit(next)
    if (isSolved(tiles.map((m, i) => rotate(m, next[i])))) onSolve()
  }

  function turn(i, by) {
    if (solved) return
    const next = [...turns]
    next[i] += by
    update(next)
  }

  // Turns one wrong tile the right way round, where the water already reaches or is about to.
  function hint() {
    if (solved) return
    const wrong = range(N * N).filter((i) => masks[i] !== solution[i])
    if (!wrong.length) return
    const nearWater = (j) => wet.has(j) || SIDES.some((side) => wet.has(across(j, side)))
    const i = wrong.find(nearWater) ?? wrong[0]
    let t = turns[i] + 1
    while (rotate(tiles[i], t) !== solution[i]) t++
    const next = [...turns]
    next[i] = t
    update(next)
    flash(i)
    onHint()
  }

  return (
    <div className="stack">
      <div className={`board pipes ${solved ? 'solved' : ''}`} style={{ '--cols': N, '--rows': N }}>
        {tiles.map((mask, i) => {
          const end = degree(mask) === 1 && i !== SOURCE
          return (
            <button
              key={i}
              className={`cell ${wet.has(i) ? 'wet' : ''} ${flashed === i ? 'hinted' : ''}`}
              onClick={() => turn(i, 1)}
              onContextMenu={(e) => {
                e.preventDefault()
                turn(i, -1)
              }}
              aria-label={i === SOURCE ? 'Source' : end ? 'Tap' : 'Pipe'}
            >
              <svg viewBox="0 0 100 100" style={{ transform: `rotate(${turns[i] * 90}deg)` }} aria-hidden="true">
                {ARMS.filter(([side]) => mask & side).map(([side, d]) => (
                  <path key={side} d={d} className="pipe" />
                ))}
                {i === SOURCE ? (
                  <rect x="27" y="27" width="46" height="46" rx="10" className="source" />
                ) : end ? (
                  <circle cx="50" cy="50" r="17" className="end" />
                ) : (
                  <circle cx="50" cy="50" r="9" className="joint" />
                )}
              </svg>
            </button>
          )
        })}
      </div>
      <GameControls history={history} locked={solved} onHint={hint} onRandomize={onRandomize} />
    </div>
  )
}
