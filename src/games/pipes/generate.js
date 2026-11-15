import { range } from '../../lib/random.js'

export const SIZE = 7
const N = SIZE

// A tile is a bitmask of the sides its pipe leaves through.
export const UP = 1
export const RIGHT = 2
export const DOWN = 4
export const LEFT = 8
export const SIDES = [UP, RIGHT, DOWN, LEFT]
const OPPOSITE = { [UP]: DOWN, [RIGHT]: LEFT, [DOWN]: UP, [LEFT]: RIGHT }
export const SOURCE = Math.floor((N * N) / 2)

// The square through side `side` of square i, or -1 off the board.
export function across(i, side) {
  const r = Math.floor(i / N)
  const c = i % N
  if (side === UP) return r > 0 ? i - N : -1
  if (side === DOWN) return r < N - 1 ? i + N : -1
  if (side === LEFT) return c > 0 ? i - 1 : -1
  return c < N - 1 ? i + 1 : -1
}

// Quarter turns clockwise: up → right → down → left.
export function rotate(mask, turns) {
  let m = mask
  for (let t = ((turns % 4) + 4) % 4; t > 0; t--) m = ((m << 1) | (m >> 3)) & 15
  return m
}

export const degree = (mask) => SIDES.filter((s) => mask & s).length

// Squares the water reaches from the source, through pipes that meet end to end.
export function flow(masks) {
  const wet = new Set([SOURCE])
  const stack = [SOURCE]
  while (stack.length) {
    const i = stack.pop()
    for (const side of SIDES) {
      if (!(masks[i] & side)) continue
      const j = across(i, side)
      if (j < 0 || !(masks[j] & OPPOSITE[side]) || wet.has(j)) continue
      wet.add(j)
      stack.push(j)
    }
  }
  return wet
}

// Solved when no pipe end is left open and the water reaches every square.
export function isSolved(masks) {
  const sealed = masks.every((m, i) =>
    SIDES.every((side) => {
      if (!(m & side)) return true
      const j = across(i, side)
      return j >= 0 && masks[j] & OPPOSITE[side]
    }),
  )
  return sealed && flow(masks).size === N * N
}

// A random tree spanning the board, grown outwards from the source (randomised Prim).
// Squares are kept to three pipes at most, so there are no four-way crosses to give things away.
function randomTree(rng) {
  const masks = Array(N * N).fill(0)
  const inTree = new Set([SOURCE])
  while (inTree.size < N * N) {
    const options = []
    for (const i of inTree) {
      for (const side of SIDES) {
        const j = across(i, side)
        if (j >= 0 && !inTree.has(j)) options.push([i, side, j])
      }
    }
    const roomy = options.filter(([i]) => degree(masks[i]) < 3)
    const pool = roomy.length ? roomy : options
    const [i, side, j] = pool[rng.int(pool.length)]
    masks[i] |= side
    masks[j] |= OPPOSITE[side]
    inTree.add(j)
  }
  return masks
}

export function generatePipes(rng) {
  const solution = randomTree(rng)
  // Turn every tile a random amount; make sure most tiles start out wrong.
  let turns
  do {
    turns = range(N * N).map(() => rng.int(4))
  } while (turns.filter((t, i) => rotate(solution[i], t) !== solution[i]).length < (N * N * 2) / 3)
  // The board shows each tile turned back by its scramble, so turning it forward that much solves it.
  const tiles = solution.map((m, i) => rotate(m, -turns[i]))
  return { tiles, solution }
}
