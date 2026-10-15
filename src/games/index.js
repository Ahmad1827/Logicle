import Sudoku from './sudoku/Sudoku.jsx'
import Minesweeper from './minesweeper/Minesweeper.jsx'
import Nonogram from './nonogram/Nonogram.jsx'
import Queens from './queens/Queens.jsx'

// To add a game: build a component that takes { seed, solved, onSolve, onMistake }
// and add it here. The daily rotation goes through this list in order.
export const GAMES = [
  {
    id: 'sudoku',
    name: 'Mini Sudoku',
    emoji: '🔢',
    rules: 'Fill the grid so every row, column and 2×3 box contains 1–6 exactly once.',
    Component: Sudoku,
  },
  {
    id: 'minesweeper',
    name: 'Minesweeper',
    emoji: '💣',
    rules: 'Reveal every safe square. Numbers show how many of the 8 neighbours are mines.',
    Component: Minesweeper,
    tracksMistakes: true,
  },
  {
    id: 'nonogram',
    name: 'Nonogram',
    emoji: '🎨',
    rules: 'Fill squares so each row and column matches its clue: the lengths of filled runs, in order.',
    Component: Nonogram,
  },
  {
    id: 'queens',
    name: 'Queens',
    emoji: '👑',
    rules: 'Place one queen in every row, column and colour region. Queens may not touch, even diagonally.',
    Component: Queens,
  },
]

export function gameForPuzzle(number) {
  const n = GAMES.length
  return GAMES[(((number - 1) % n) + n) % n]
}

export function getGame(id) {
  return GAMES.find((g) => g.id === id)
}
