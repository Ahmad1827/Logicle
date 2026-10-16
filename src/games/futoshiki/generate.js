import { range } from '../../lib/random.js'

export const SIZE = 5
const N = SIZE
const ALL = ((1 << N) - 1) << 1 // bits 1..N

const bitCount = (m) => m.toString(2).replace(/0/g, '').length
const lowBit = (m) => 31 - Math.clz32(m & -m)
const highBit = (m) => 31 - Math.clz32(m)

function randomLatin(rng) {
  const grid = Array(N * N).fill(0)
  function fill(i) {
    if (i === N * N) return true
    const r = Math.floor(i / N)
    const c = i % N
    for (const v of rng.shuffle(range(N).map((k) => k + 1))) {
      let ok = true
      for (let k = 0; k < N && ok; k++) {
        if ((k < c && grid[r * N + k] === v) || (k < r && grid[k * N + c] === v)) ok = false
      }
      if (!ok) continue
      grid[i] = v
      if (fill(i + 1)) return true
    }
    grid[i] = 0
    return false
  }
  fill(0)
  return grid
}

const LINES = [
  ...range(N).map((r) => range(N).map((c) => r * N + c)),
  ...range(N).map((c) => range(N).map((r) => r * N + c)),
]

// Candidate elimination only: singles, hidden singles and the bounds each sign puts
// on its neighbours. Puzzles are kept only if this finishes them, so no guessing.
function solvableByLogic(givens, signs) {
  const cand = givens.map((v) => (v ? 1 << v : ALL))
  let changed = true
  const set = (i, m) => {
    if (m === cand[i]) return
    cand[i] = m
    changed = true
  }
  while (changed) {
    changed = false
    for (const line of LINES) {
      for (const i of line) {
        if (bitCount(cand[i]) !== 1) continue
        for (const j of line) if (j !== i) set(j, cand[j] & ~cand[i])
      }
      for (let v = 1; v <= N; v++) {
        const cells = line.filter((i) => cand[i] & (1 << v))
        if (cells.length === 1) set(cells[0], 1 << v)
      }
    }
    for (const { a, b } of signs) {
      // value(a) < value(b)
      if (!cand[a] || !cand[b]) return false
      set(a, cand[a] & ((1 << highBit(cand[b])) - 1))
      if (!cand[a]) return false
      set(b, cand[b] & ~((2 << lowBit(cand[a])) - 1))
    }
    if (cand.some((m) => !m)) return false
  }
  return cand.every((m) => bitCount(m) === 1)
}

// signs: { a, b } means the value at a is smaller than at b; a and b are neighbours.
export function generateFutoshiki(rng) {
  const solution = randomLatin(rng)
  let signs = []
  for (let i = 0; i < N * N; i++) {
    for (const j of [i % N < N - 1 ? i + 1 : -1, i + N < N * N ? i + N : -1]) {
      if (j < 0) continue
      signs.push(solution[i] < solution[j] ? { a: i, b: j } : { a: j, b: i })
    }
  }
  const givens = [...solution]
  for (const i of rng.shuffle(range(N * N))) {
    const v = givens[i]
    givens[i] = 0
    if (!solvableByLogic(givens, signs)) givens[i] = v
  }
  for (const s of rng.shuffle([...signs])) {
    const without = signs.filter((t) => t !== s)
    if (solvableByLogic(givens, without)) signs = without
  }
  return { solution, givens, signs }
}
