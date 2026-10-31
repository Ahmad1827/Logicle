import { useReducer } from 'react'

// Board states are small arrays, so comparing them as JSON is cheap and lets
// moves that change nothing (erasing an empty square) stay out of the history.
const same = (a, b) => a === b || JSON.stringify(a) === JSON.stringify(b)

function apply(h, next, group = null) {
  if (same(next, h.present)) return h
  // Changes with the same group token (one drag, say) are a single undo step.
  if (group !== null && group === h.group) return { ...h, present: next }
  return { ...h, past: [...h.past, h.present], present: next, future: [], group }
}

function reducer(h, action) {
  switch (action.type) {
    case 'commit':
      return apply(h, typeof action.next === 'function' ? action.next(h.present) : action.next, action.group)
    case 'undo':
      if (!h.past.length) return h
      return { ...h, past: h.past.slice(0, -1), present: h.past.at(-1), future: [h.present, ...h.future], group: null }
    case 'redo':
      if (!h.future.length) return h
      return { ...h, past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1), group: null }
    case 'reset':
      // An ordinary step, so a mistaken reset can be undone.
      return apply(h, h.initial)
    default:
      return h
  }
}

function init(initial) {
  const state = typeof initial === 'function' ? initial() : initial
  return { initial: state, past: [], present: state, future: [], group: null }
}

// useState with undo, redo and reset. Pass a board's starting state.
export function useHistory(initial) {
  const [h, dispatch] = useReducer(reducer, initial, init)
  return {
    present: h.present,
    commit: (next, group) => dispatch({ type: 'commit', next, group }),
    undo: () => dispatch({ type: 'undo' }),
    redo: () => dispatch({ type: 'redo' }),
    reset: () => dispatch({ type: 'reset' }),
    canUndo: h.past.length > 0,
    canRedo: h.future.length > 0,
    canReset: !same(h.present, h.initial),
  }
}
