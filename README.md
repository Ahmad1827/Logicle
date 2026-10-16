# Logicle

A new logic puzzle every day: Sudoku, Minesweeper, Nonogram, Queens, KenKen, Takuzu, Tents,
Futoshiki, Light Up and Hitori.
Everyone gets the same puzzle on the same day. Solve it, keep your streak, share your time.

## Run locally

```sh
npm install
npm run dev
```

## Deploy to GitHub Pages

1. Push this folder to a GitHub repo (branch `main`).
2. In the repo: **Settings → Pages → Source: GitHub Actions**.
3. Every push to `main` builds and deploys automatically (`.github/workflows/deploy.yml`).

## How it works

- Puzzle #1 is 2026-10-15. The puzzle number picks the game (rotating through `src/games/index.js`)
  and the date is the random seed, so every player gets the identical puzzle.
- Every generator guarantees exactly one solution.
- Results and streaks are stored in the browser's `localStorage`.

## Adding a game

1. Create `src/games/<name>/generate.js` (puzzle generator using the `rng` it's given) and a component
   that takes `{ seed, solved, onSolve, onMistake }`.
2. Add it to the `GAMES` list in `src/games/index.js`.
