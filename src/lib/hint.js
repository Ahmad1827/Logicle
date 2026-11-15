import { useRef, useState } from 'react'
import { range } from './random.js'

// Briefly outlines whatever a hint just changed. `id` is any value the board can compare with.
export function useFlash(ms = 1400) {
  const [flash, setFlash] = useState(null)
  const timer = useRef(null)
  function show(id) {
    clearTimeout(timer.current)
    setFlash(id)
    timer.current = setTimeout(() => setFlash(null), ms)
  }
  return [flash, show]
}

// Row and column neighbours of every square in an n×n Latin square.
export function linePeers(n) {
  return range(n * n).map((i) => {
    const r = Math.floor(i / n)
    const c = i % n
    return range(n).flatMap((k) => [r * n + k, k * n + c]).filter((j) => j !== i)
  })
}

// Which square a number-grid hint should fill: a wrong entry first, then the selected
// square if it's empty, then the empty square with the fewest numbers left to try.
export function pickNumberHint({ grid, solution, fixed, selected, peers, size }) {
  const wrong = grid.findIndex((v, i) => !fixed[i] && v && v !== solution[i])
  if (wrong >= 0) return wrong
  if (selected >= 0 && !grid[selected] && !fixed[selected]) return selected
  let best = -1
  let fewest = Infinity
  grid.forEach((v, i) => {
    if (v) return
    const seen = new Set(peers[i].map((p) => grid[p]).filter(Boolean))
    const left = size - seen.size
    if (left < fewest) {
      fewest = left
      best = i
    }
  })
  return best
}
