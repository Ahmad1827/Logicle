# Logicle

A new logic puzzle every day: Sudoku, Minesweeper, Nonogram, Queens, KenKen, Takuzu, Tents,
Futoshiki, Light Up, Hitori, Miaudoku, Skyscrapers, Nurikabe, Shikaku and Bridges.
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

## Phone app

The app is the same website wrapped with [Capacitor](https://capacitorjs.com), so game changes reach
both. Only `src/lib/native.js` differs between them: back button, share sheet and haptics. After changing
the site, rebuild the app with one of these:

```sh
npm run app:apk    # Android: writes android/app/build/outputs/apk/debug/app-debug.apk
npm run app:sync   # Android + iOS: copies the latest build into both native projects
```

The Android build needs the Android SDK (`ANDROID_HOME`); Gradle fetches JDK 21 itself. iOS needs a Mac:
run `npm run app:sync`, then `npx cap open ios` and build in Xcode. To regenerate the icons and splash
screens from `assets/logo.png`, use `npx @capacitor/assets generate --android --ios --iconBackgroundColor '#fbfaf8' --iconBackgroundColorDark '#141317' --splashBackgroundColor '#fbfaf8' --splashBackgroundColorDark '#141317'`.

## How it works

- Puzzle #1 is 2026-10-15. The puzzle number picks the game (rotating through `src/games/index.js`)
  and the date is the random seed, so every player gets the identical puzzle.
- Every generator guarantees exactly one solution.
- Results and streaks are stored in the browser's `localStorage`.

## Adding a game

1. Create `src/games/<name>/generate.js` (puzzle generator using the `rng` it's given) and a component
   that takes `{ seed, solved, onSolve, onMistake }`.
2. Add it to the `GAMES` list in `src/games/index.js`.
