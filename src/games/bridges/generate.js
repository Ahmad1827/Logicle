import { range } from '../../lib/random.js'

export const SIZE = 7
const N = SIZE
const DIRS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
]

// The squares strictly between two islands on the same row or column.
export function between(a, b) {
  const [lo, hi] = a < b ? [a, b] : [b, a]
  const step = Math.floor(lo / N) === Math.floor(hi / N) ? 1 : N
  const out = []
  for (let j = lo + step; j < hi; j += step) out.push(j)
  return out
}

export const edgeKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`)

// Each island's nearest island in each direction: the only ones a bridge can reach.
export function findEdges(islands) {
  const edges = []
  for (const a of islands.keys()) {
    const r = Math.floor(a / N)
    const c = a % N
    for (const [dr, dc] of [[1, 0], [0, 1]]) {
      for (let rr = r + dr, cc = c + dc; rr < N && cc < N; rr += dr, cc += dc) {
        const b = rr * N + cc
        if (islands.has(b)) {
          edges.push({ a, b, cells: between(a, b), horizontal: dc === 1 })
          break
        }
      }
    }
  }
  return edges
}

// Two bridges cross if one is horizontal, the other vertical, and they share a square.
export function crosses(e, f) {
  if (e.horizontal === f.horizontal) return false
  return e.cells.some((j) => f.cells.includes(j))
}

export function connected(islands, count) {
  const ids = [...islands.keys()]
  const seen = new Set([ids[0]])
  const stack = [ids[0]]
  while (stack.length) {
    const a = stack.pop()
    for (const [key, n] of count) {
      if (!n) continue
      const [x, y] = key.split('-').map(Number)
      const other = x === a ? y : y === a ? x : null
      if (other !== null && !seen.has(other)) {
        seen.add(other)
        stack.push(other)
      }
    }
  }
  return seen.size === ids.length
}

// islands: square -> number of bridges. Each edge gets 0, 1 or 2 bridges.
function countSolutions(islands, limit) {
  const edges = findEdges(islands)
  const need = new Map(islands)
  const open = new Map([...islands.keys()].map((a) => [a, 0])) // capacity of undecided edges
  edges.forEach((e) => {
    open.set(e.a, open.get(e.a) + 2)
    open.set(e.b, open.get(e.b) + 2)
  })
  const value = Array(edges.length).fill(0)
  const crossing = edges.map((e) => edges.map((f, k) => (crosses(e, f) ? k : -1)).filter((k) => k >= 0))
  let count = 0

  function ok(a) {
    return need.get(a) >= 0 && need.get(a) <= open.get(a)
  }

  function step(k) {
    if (count >= limit) return
    if (k === edges.length) {
      if ([...need.values()].every((v) => v === 0)) {
        const map = new Map(edges.map((e, j) => [edgeKey(e.a, e.b), value[j]]))
        if (connected(islands, map)) count++
      }
      return
    }
    const e = edges[k]
    open.set(e.a, open.get(e.a) - 2)
    open.set(e.b, open.get(e.b) - 2)
    for (let v = 0; v <= 2; v++) {
      if (v && crossing[k].some((j) => j < k && value[j])) break
      value[k] = v
      need.set(e.a, need.get(e.a) - v)
      need.set(e.b, need.get(e.b) - v)
      if (ok(e.a) && ok(e.b)) step(k + 1)
      need.set(e.a, need.get(e.a) + v)
      need.set(e.b, need.get(e.b) + v)
    }
    value[k] = 0
    open.set(e.a, open.get(e.a) + 2)
    open.set(e.b, open.get(e.b) + 2)
  }
  step(0)
  return count
}

// Grow a connected set of islands outward from one, laying a bridge to each new one.
function randomPuzzle(rng) {
  const islands = new Map()
  const bridges = [] // { a, b, n }
  const blocked = new Set() // squares under a bridge
  const start = rng.int(N * N)
  islands.set(start, 0)
  const target = 9 + rng.int(4)

  const nearIsland = (j) =>
    [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dr, dc]) => {
      const r = Math.floor(j / N) + dr
      const c = (j % N) + dc
      return r >= 0 && r < N && c >= 0 && c < N && islands.has(r * N + c)
    })

  for (let tries = 0; tries < 400 && islands.size < target; tries++) {
    const ids = [...islands.keys()]
    const a = ids[rng.int(ids.length)]
    const [dr, dc] = DIRS[rng.int(4)]
    const dist = 2 + rng.int(4)
    const r = Math.floor(a / N) + dr * dist
    const c = (a % N) + dc * dist
    if (r < 0 || r >= N || c < 0 || c >= N) continue
    const b = r * N + c
    const path = between(a, b)
    if (islands.has(b) || blocked.has(b) || nearIsland(b)) continue
    if (path.some((j) => islands.has(j) || blocked.has(j))) continue
    islands.set(b, 0)
    path.forEach((j) => blocked.add(j))
    bridges.push({ a, b, n: 1 + rng.int(2) })
  }
  // Extra bridges between islands that already see each other make loops.
  for (const e of rng.shuffle(findEdges(islands))) {
    if (rng.next() < 0.6) continue
    if (bridges.some((x) => edgeKey(x.a, x.b) === edgeKey(e.a, e.b))) continue
    if (e.cells.some((j) => blocked.has(j))) continue
    e.cells.forEach((j) => blocked.add(j))
    bridges.push({ a: e.a, b: e.b, n: 1 + rng.int(2) })
  }
  for (const { a, b, n } of bridges) {
    islands.set(a, islands.get(a) + n)
    islands.set(b, islands.get(b) + n)
  }
  return { islands, bridges }
}

export function generateBridges(rng) {
  let fallback
  for (let attempt = 0; attempt < 300; attempt++) {
    const puzzle = randomPuzzle(rng)
    if (puzzle.islands.size < 8) continue
    fallback = puzzle
    if (countSolutions(puzzle.islands, 2) === 1) return puzzle
  }
  return fallback
}
