import { range } from '../../lib/random.js'

export const SIZE = 7
const N = SIZE
const MAX_AREA = 9

// Every rectangle with the given area that covers square i: { r0, c0, r1, c1 }, inclusive.
function rectsThrough(i, area) {
  const r = Math.floor(i / N)
  const c = i % N
  const out = []
  for (let h = 1; h <= area; h++) {
    if (area % h) continue
    const w = area / h
    if (h > N || w > N) continue
    for (let r0 = Math.max(0, r - h + 1); r0 <= Math.min(r, N - h); r0++) {
      for (let c0 = Math.max(0, c - w + 1); c0 <= Math.min(c, N - w); c0++) {
        out.push({ r0, c0, r1: r0 + h - 1, c1: c0 + w - 1 })
      }
    }
  }
  return out
}

export function rectCells({ r0, c0, r1, c1 }) {
  const out = []
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) out.push(r * N + c)
  return out
}

// clues: square index -> area. Covers the first empty square each step.
function countSolutions(clues, limit) {
  const options = []
  for (const [i, area] of clues) {
    for (const rect of rectsThrough(i, area)) {
      const cells = rectCells(rect)
      if (cells.every((j) => j === i || !clues.has(j))) options.push(cells)
    }
  }
  const byCell = range(N * N).map(() => [])
  for (const cells of options) for (const j of cells) byCell[j].push(cells)
  const used = Array(N * N).fill(false)
  let count = 0
  function step() {
    if (count >= limit) return
    const i = used.indexOf(false)
    if (i < 0) {
      count++
      return
    }
    for (const cells of byCell[i]) {
      if (cells.some((j) => used[j])) continue
      cells.forEach((j) => (used[j] = true))
      step()
      cells.forEach((j) => (used[j] = false))
    }
  }
  step()
  return count
}

// Cut the grid into random rectangles, scanning for the first uncovered square.
function randomPartition(rng) {
  const owner = Array(N * N).fill(-1)
  const rects = []
  for (let i = 0; i < N * N; i++) {
    if (owner[i] >= 0) continue
    const r = Math.floor(i / N)
    const c = i % N
    let maxW = 0
    while (c + maxW < N && owner[r * N + c + maxW] < 0) maxW++
    const shapes = []
    for (let h = 1; r + h <= N; h++) {
      for (let w = 1; w <= maxW; w++) {
        if (h * w > MAX_AREA) continue
        if (h * w === 1 && (maxW > 1 || r < N - 1)) continue // single squares only when forced
        shapes.push({ h, w })
      }
    }
    // Prefer middling sizes; tiny strips make dull puzzles.
    const weighted = shapes.flatMap((s) => Array(s.h * s.w >= 3 ? 3 : 1).fill(s))
    const { h, w } = weighted[rng.int(weighted.length)] ?? { h: 1, w: 1 }
    const rect = { r0: r, c0: c, r1: r + h - 1, c1: c + w - 1 }
    rectCells(rect).forEach((j) => (owner[j] = rects.length))
    rects.push(rect)
  }
  return rects
}

export function generateShikaku(rng) {
  let fallback
  for (let attempt = 0; attempt < 200; attempt++) {
    const rects = randomPartition(rng)
    if (rects.some((rect) => rectCells(rect).length === 1)) continue
    const clues = new Map()
    for (const rect of rects) {
      const cells = rectCells(rect)
      clues.set(cells[rng.int(cells.length)], cells.length)
    }
    fallback = { clues, rects }
    if (countSolutions(clues, 2) === 1) return fallback
  }
  return fallback
}
