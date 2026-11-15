import { useEffect } from 'react'
import { useActive } from './lib/active.js'
import { BulbOutlineIcon, RedoIcon, ResetIcon, ShuffleIcon, UndoIcon } from './icons.jsx'

// Undo, redo, reset, hint and new puzzle for any board using useHistory.
// `onHint` is the game's own hint; `onRandomize` starts a fresh puzzle of the same game.
export default function GameControls({ history, locked, onHint, onRandomize }) {
  const active = useActive()

  useEffect(() => {
    if (!active) return
    function onKey(e) {
      if (locked || !(e.ctrlKey || e.metaKey)) return
      const key = e.key.toLowerCase()
      if (key === 'z' && !e.shiftKey) history.undo()
      else if (key === 'y' || (key === 'z' && e.shiftKey)) history.redo()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="game-controls">
      <button onClick={history.undo} disabled={locked || !history.canUndo} aria-label="Undo">
        <UndoIcon /> <span>Undo</span>
      </button>
      <button onClick={history.redo} disabled={locked || !history.canRedo} aria-label="Redo">
        <RedoIcon /> <span>Redo</span>
      </button>
      <button onClick={history.reset} disabled={locked || !history.canReset} aria-label="Reset board">
        <ResetIcon /> <span>Reset</span>
      </button>
      {onHint && (
        <button onClick={onHint} disabled={locked} aria-label="Hint">
          <BulbOutlineIcon /> <span>Hint</span>
        </button>
      )}
      {onRandomize && (
        <button onClick={onRandomize} aria-label="New puzzle">
          <ShuffleIcon /> <span>New</span>
        </button>
      )}
    </div>
  )
}
