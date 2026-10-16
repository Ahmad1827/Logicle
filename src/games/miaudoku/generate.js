import { generateQueens } from '../queens/generate.js'

// Queens rules with cats, on a 6×6 or 7×7 board, with one starter cat already placed.
export function generateMiaudoku(rng) {
  const size = 6 + rng.int(2)
  const { regions, queens } = generateQueens(rng, size)
  const cats = queens.map((c, r) => r * size + c)
  return { size, regions, cats, starter: cats[rng.int(size)] }
}
