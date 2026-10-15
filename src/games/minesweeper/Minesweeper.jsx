import { useMemo, useState } from 'react'
import { createRng } from '../../lib/random.js'
import { generateMinesweeper, floodReveal, W, H, MINES } from './generate.js'

export default function Minesweeper({ seed, solved, onSolve, onMistake }) {
  const { mine, counts, start } = useMemo(() => generateMinesweeper(createRng(seed)), [seed])
  const [revealed, setRevealed] = useState(() => {
    const r = Array(W * H).fill(false)
    floodReveal(start, r, counts)
    return r
  })
  const [flagged, setFlagged] = useState(() => Array(W * H).fill(false))
  const [exploded, setExploded] = useState(() => Array(W * H).fill(false))
  const [flagMode, setFlagMode] = useState(false)

  function toggleFlag(i) {
    const next = [...flagged]
    next[i] = !next[i]
    setFlagged(next)
  }

  function act(i, flag) {
    if (solved || revealed[i] || exploded[i]) return
    if (flag) return toggleFlag(i)
    if (flagged[i]) return
    if (mine[i]) {
      const next = [...exploded]
      next[i] = true
      setExploded(next)
      onMistake()
      return
    }
    const next = [...revealed]
    floodReveal(i, next, counts, (j) => flagged[j] || mine[j])
    setRevealed(next)
    if (next.filter(Boolean).length === W * H - MINES) onSolve()
  }

  const minesLeft = MINES - flagged.filter(Boolean).length - exploded.filter(Boolean).length

  return (
    <div className="stack">
      <div className="toolbar">
        <span>💣 {minesLeft} left</span>
        <div className="toggle">
          <button className={!flagMode ? 'active' : ''} onClick={() => setFlagMode(false)}>
            Reveal
          </button>
          <button className={flagMode ? 'active' : ''} onClick={() => setFlagMode(true)}>
            🚩 Flag
          </button>
        </div>
      </div>
      <div className="board mines" style={{ '--cols': W }}>
        {mine.map((isMine, i) => {
          let content = ''
          let cls = 'cell hidden'
          if (exploded[i]) {
            content = '💥'
            cls = 'cell exploded'
          } else if (revealed[i]) {
            cls = `cell open n${counts[i]}`
            content = counts[i] || ''
          } else if (solved && isMine) {
            content = '💣'
          } else if (flagged[i]) {
            content = '🚩'
          }
          return (
            <button
              key={i}
              className={cls}
              onClick={() => act(i, flagMode)}
              onContextMenu={(e) => {
                e.preventDefault()
                act(i, true)
              }}
            >
              {content}
            </button>
          )
        })}
      </div>
      <p className="hint">Right-click or use Flag mode to mark mines. No guessing is ever needed.</p>
    </div>
  )
}
