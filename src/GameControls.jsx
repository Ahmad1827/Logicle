import { useEffect } from 'react'
import { RedoIcon, ResetIcon, ShuffleIcon, UndoIcon } from './icons.jsx'

// Undo, redo and reset for any board using useHistory. `onRandomize` is only
// passed in Practice: the daily puzzle is the same for everyone.
export default function GameControls({ history, locked, onRandomize }) {
  useEffect(() => {
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
      {onRandomize && (
        <button onClick={onRandomize} aria-label="New random puzzle">
          <ShuffleIcon /> <span>New</span>
        </button>
      )}
    </div>
  )
}
