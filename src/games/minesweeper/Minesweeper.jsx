import { useMemo, useRef, useState } from 'react'
import { createRng } from '../../lib/random.js'
import { FlagIcon, MineIcon, SquareIcon } from '../../icons.jsx'
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
  const press = useRef(null) // long-press on touch screens flags a square

  function startPress(e, i) {
    if (e.pointerType !== 'touch') return
    clearTimeout(press.current?.timer)
    press.current = {
      fired: false,
      timer: setTimeout(() => {
        press.current.fired = true
        navigator.vibrate?.(15)
        act(i, true)
      }, 350),
    }
  }

  function endPress() {
    clearTimeout(press.current?.timer)
  }

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
        <span className="count">
          <MineIcon /> {minesLeft}
        </span>
        <div className="toggle">
          <button className={!flagMode ? 'active' : ''} onClick={() => setFlagMode(false)} aria-label="Reveal">
            <SquareIcon />
          </button>
          <button className={flagMode ? 'active' : ''} onClick={() => setFlagMode(true)} aria-label="Flag">
            <FlagIcon />
          </button>
        </div>
      </div>
      <div className="board mines" style={{ '--cols': W, '--rows': H }}>
        {mine.map((isMine, i) => {
          let content = ''
          let cls = 'cell hidden'
          if (exploded[i]) {
            content = <MineIcon />
            cls = 'cell exploded'
          } else if (revealed[i]) {
            cls = `cell open n${counts[i]}`
            content = counts[i] || ''
          } else if (solved && isMine) {
            content = <MineIcon />
          } else if (flagged[i]) {
            content = <FlagIcon />
          }
          return (
            <button
              key={i}
              className={cls}
              onPointerDown={(e) => startPress(e, i)}
              onPointerUp={endPress}
              onPointerLeave={endPress}
              onPointerCancel={endPress}
              onClick={() => {
                if (press.current?.fired) {
                  press.current = null
                  return
                }
                act(i, flagMode)
              }}
              onContextMenu={(e) => {
                e.preventDefault()
                if (!press.current?.fired) act(i, true)
              }}
            >
              {content}
            </button>
          )
        })}
      </div>
    </div>
  )
}
