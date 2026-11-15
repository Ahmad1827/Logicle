import { useMemo } from 'react'
import GameControls from '../../GameControls.jsx'
import { useFlash } from '../../lib/hint.js'
import { useHistory } from '../../lib/history.js'
import { createRng } from '../../lib/random.js'
import { generateFlip, lightsAfter, shortest, SIZE } from './generate.js'

const N = SIZE

export default function Flip({ seed, solved, onSolve, onHint, onRandomize }) {
  const { start, answer } = useMemo(() => generateFlip(createRng(seed)), [seed])
  // Which squares have been pressed an odd number of times, plus the running move count.
  const history = useHistory(() => ({ pressed: Array(N * N).fill(0), moves: 0 }))
  const { pressed, moves } = history.present
  const lights = lightsAfter(start, pressed)
  const [flashed, flash] = useFlash()
  const best = answer.filter(Boolean).length
  // Still to press: whatever separates the presses made so far from an answer, the shortest way.
  const todo = shortest(pressed.map((p, i) => p ^ answer[i]))

  function press(i) {
    if (solved) return
    const next = [...pressed]
    next[i] ^= 1
    history.commit({ pressed: next, moves: moves + 1 })
    if (lightsAfter(start, next).every((v) => !v)) onSolve()
  }

  function hint() {
    if (solved) return
    const i = todo.findIndex(Boolean)
    if (i < 0) return
    press(i)
    flash(i)
    onHint()
  }

  return (
    <div className="stack">
      <div className="toolbar">
        <span className="count">Moves {moves}</span>
        <span className="count muted-count">Best {best}</span>
      </div>
      <div className="board flip" style={{ '--cols': N, '--rows': N }}>
        {lights.map((on, i) => (
          <button
            key={i}
            className={`cell ${on ? 'on' : ''} ${flashed === i ? 'hinted' : ''}`}
            onClick={() => press(i)}
            aria-label={on ? 'Light on' : 'Light off'}
          />
        ))}
      </div>
      <GameControls history={history} locked={solved} onHint={hint} onRandomize={onRandomize} />
    </div>
  )
}
