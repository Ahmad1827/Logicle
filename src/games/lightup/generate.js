import { range } from '../../lib/random.js'

export const SIZE = 7
const N = SIZE
export const WHITE = -2
export const BLACK = -1 // black square without a number; 0–4 are numbered black squares

export function neighbours(i) {
  const r = Math.floor(i / N)
  const c = i % N
  return [r > 0 && i - N, r < N - 1 && i + N, c > 0 && i - 1, c < N - 1 && i + 1].filter((n) => n !== false)
}

// The white squares a bulb at i would light (itself included), stopping at black squares.
export function sightLines(board, i) {
  const out = [i]
  const r = Math.floor(i / N)
  const c = i % N
  for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    for (let rr = r + dr, cc = c + dc; rr >= 0 && rr < N && cc >= 0 && cc < N; rr += dr, cc += dc) {
      const j = rr * N + cc
      if (board[j] !== WHITE) break
      out.push(j)
    }
  }
  return out
}

function countSolutions(board, limit) {
  const sight = board.map((v, i) => (v === WHITE ? sightLines(board, i) : null))
  const numbered = range(N * N).filter((i) => board[i] >= 0)
  const lit = Array(N * N).fill(0)
  const bulb = Array(N * N).fill(false)
  const banned = Array(N * N).fill(0)
  const free = (j) => board[j] === WHITE && !bulb[j] && !lit[j] && !banned[j]
  let count = 0

  function numbersOk(exact) {
    for (const k of numbered) {
      const adj = neighbours(k)
      const have = adj.filter((j) => bulb[j]).length
      if (have > board[k]) return false
      if (exact ? have !== board[k] : have + adj.filter(free).length < board[k]) return false
    }
    return true
  }

  function search() {
    if (count >= limit) return
    // The dark square with the fewest places a bulb could light it from.
    let best = null
    for (let i = 0; i < N * N; i++) {
      if (board[i] !== WHITE || lit[i]) continue
      const options = sight[i].filter(free)
      if (!best || options.length < best.length) best = options
      if (!best.length) return
    }
    if (!best) {
      if (numbersOk(true)) count++
      return
    }
    for (const j of best) {
      bulb[j] = true
      for (const k of sight[j]) lit[k]++
      if (numbersOk(false)) search()
      for (const k of sight[j]) lit[k]--
      bulb[j] = false
      banned[j]++
    }
    for (const j of best) banned[j]--
  }

  search()
  return count
}

export function generateLightUp(rng) {
  let result
  for (let attempt = 0; attempt < 100; attempt++) {
    // Black squares in a rotationally symmetric pattern, like printed puzzles.
    const board = Array(N * N).fill(WHITE)
    for (let i = 0; i <= (N * N) >> 1; i++) {
      if (rng.next() < 0.2) board[i] = board[N * N - 1 - i] = BLACK
    }
    // Light it with bulbs placed in random dark squares until nothing is dark.
    const bulbs = new Set()
    const lit = new Set()
    for (const i of rng.shuffle(range(N * N))) {
      if (board[i] !== WHITE || lit.has(i)) continue
      bulbs.add(i)
      sightLines(board, i).forEach((j) => lit.add(j))
    }
    const full = board.map((v, i) => (v === BLACK ? neighbours(i).filter((j) => bulbs.has(j)).length : v))
    if (countSolutions(full, 2) !== 1) continue
    // Hide numbers while the answer stays unique.
    for (const i of rng.shuffle(range(N * N))) {
      if (full[i] < 0) continue
      const v = full[i]
      full[i] = BLACK
      if (countSolutions(full, 2) !== 1) full[i] = v
    }
    result = { board: full, bulbs }
    return result
  }
  return result
}
