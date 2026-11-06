import { range } from '../../lib/random.js'

export const SIZE = 7
const N = SIZE
const MAX_ISLAND = 5

export function neighbours(i) {
  const r = Math.floor(i / N)
  const c = i % N
  return [r > 0 && i - N, r < N - 1 && i + N, c > 0 && i - 1, c < N - 1 && i + 1].filter((n) => n !== false)
}

// Top-left corners of every 2×2 block.
const BLOCKS = range(N * N).filter((i) => i % N < N - 1 && i < N * (N - 1))
export const blockCells = (i) => [i, i + 1, i + N, i + N + 1]

// Is the sea (cells where isSea is true) one connected piece?
export function seaConnected(isSea) {
  const start = range(N * N).find(isSea)
  if (start === undefined) return true
  const seen = new Set([start])
  const stack = [start]
  while (stack.length) {
    for (const n of neighbours(stack.pop())) {
      if (isSea(n) && !seen.has(n)) {
        seen.add(n)
        stack.push(n)
      }
    }
  }
  return seen.size === range(N * N).filter(isSea).length
}

// Every connected shape of `size` squares containing `start`, as sorted index arrays.
function shapesFrom(start, size, allowed) {
  const found = new Map()
  function grow(cells) {
    if (cells.length === size) {
      const key = [...cells].sort((a, b) => a - b)
      found.set(key.join(), key)
      return
    }
    const inside = new Set(cells)
    const frontier = new Set()
    for (const i of cells) for (const n of neighbours(i)) if (!inside.has(n) && allowed(n)) frontier.add(n)
    // Islands are at most 5 squares, so growing in every order is cheap; the Map drops duplicates.
    for (const n of frontier) grow([...cells, n])
  }
  grow([start])
  return [...found.values()]
}

// clues: square -> island size. One island shape is chosen per clue, then the sea is checked.
function countSolutions(clues, limit) {
  const clueCells = [...clues.keys()]
  const isClue = new Set(clueCells)
  const options = clueCells.map((i) => {
    // An island never reaches a square touching another clue's square.
    const allowed = (j) => !isClue.has(j) && !neighbours(j).some((n) => n !== i && isClue.has(n))
    return shapesFrom(i, clues.get(i), allowed)
  })
  const order = range(clueCells.length).sort((a, b) => options[a].length - options[b].length)
  const owner = Array(N * N).fill(-1)
  let count = 0

  // Squares some remaining clue could still turn into island.
  function reachable(k) {
    const can = new Uint8Array(N * N)
    for (let t = k; t < order.length; t++) {
      for (const shape of options[order[t]]) {
        if (fits(shape, order[t])) shape.forEach((j) => (can[j] = 1))
      }
    }
    return can
  }

  function fits(shape, id) {
    for (const j of shape) {
      if (owner[j] >= 0) return false
      for (const n of neighbours(j)) if (owner[n] >= 0 && owner[n] !== id) return false
    }
    return true
  }

  function step(k) {
    if (count >= limit) return
    const can = reachable(k)
    // A 2×2 block nobody can break up would be a pool of sea.
    for (const b of BLOCKS) if (blockCells(b).every((j) => owner[j] < 0 && !can[j])) return
    if (!seaConnected((j) => owner[j] < 0)) return
    if (k === order.length) {
      count++
      return
    }
    const id = order[k]
    for (const shape of options[id]) {
      if (!fits(shape, id)) continue
      shape.forEach((j) => (owner[j] = id))
      step(k + 1)
      shape.forEach((j) => (owner[j] = -1))
      if (count >= limit) return
    }
  }
  step(0)
  return count
}

// Turn sea into island one square at a time until no 2×2 pool of sea is left.
function randomSolution(rng) {
  const island = Array(N * N).fill(-1)
  const sizes = []
  const isSea = (j) => island[j] < 0
  const pools = () => BLOCKS.filter((b) => blockCells(b).every(isSea))

  function tryClaim(j) {
    if (!isSea(j)) return false
    const near = new Set(neighbours(j).filter((n) => !isSea(n)).map((n) => island[n]))
    if (near.size > 1) return false
    const id = near.size ? [...near][0] : sizes.length
    if (near.size && sizes[id] >= MAX_ISLAND) return false
    island[j] = id
    if (!seaConnected(isSea)) {
      island[j] = -1
      return false
    }
    if (near.size) sizes[id]++
    else sizes.push(1)
    return true
  }

  for (let guard = 0; guard < 200; guard++) {
    const left = pools()
    if (!left.length) break
    const cells = rng.shuffle(blockCells(left[rng.int(left.length)]))
    if (!cells.some(tryClaim)) return null
    // Sometimes let an island grow on, so they aren't all tiny.
    if (rng.next() < 0.5) {
      for (const n of rng.shuffle(range(N * N))) {
        if (isSea(n) && neighbours(n).some((m) => !isSea(m)) && tryClaim(n)) break
      }
    }
  }
  if (pools().length) return null
  return { island, sizes }
}

export function generateNurikabe(rng) {
  let fallback
  for (let attempt = 0; attempt < 300 || !fallback; attempt++) {
    const sol = randomSolution(rng)
    if (!sol) continue
    const { island, sizes } = sol
    const clues = new Map()
    sizes.forEach((size, id) => {
      const cells = range(N * N).filter((j) => island[j] === id)
      clues.set(cells[rng.int(cells.length)], size)
    })
    fallback = { clues, sea: island.map((v) => v < 0) }
    if (countSolutions(clues, 2) === 1) return fallback
  }
  return fallback
}
