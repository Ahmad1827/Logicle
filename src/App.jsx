import { useCallback, useEffect, useRef, useState } from 'react'
import { GAMES, gameForPuzzle } from './games/index.js'
import { dayKey, formatTime, msUntilTomorrow, puzzleNumber } from './lib/daily.js'
import { currentStreak, loadResults, saveResults } from './lib/stats.js'

function useNow(interval = 1000) {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval)
    return () => clearInterval(id)
  }, [interval])
  return now
}

function PuzzleRunner({ game, seed, onFinish }) {
  const start = useRef(Date.now())
  const done = useRef(false)
  const mistakesRef = useRef(0)
  const [mistakes, setMistakes] = useState(0)
  const [result, setResult] = useState(null)
  const now = useNow()

  const onSolve = useCallback(() => {
    if (done.current) return
    done.current = true
    const r = { time: Date.now() - start.current, mistakes: mistakesRef.current }
    setResult(r)
    onFinish(r)
  }, [onFinish])

  const onMistake = useCallback(() => {
    mistakesRef.current++
    setMistakes(mistakesRef.current)
  }, [])

  return (
    <section>
      <div className="game-head">
        <h2>
          {game.emoji} {game.name}
        </h2>
        <span className="timer">
          {formatTime(result ? result.time : now - start.current)}
          {game.tracksMistakes && ` · 💥 ${mistakes}`}
        </span>
      </div>
      <p className="rules">{game.rules}</p>
      <game.Component seed={seed} solved={!!result} onSolve={onSolve} onMistake={onMistake} />
    </section>
  )
}

function DailyDone({ number, game, result, streak }) {
  const now = useNow()
  const [copied, setCopied] = useState(false)
  const text = [
    `Logicle #${number} · ${game.emoji} ${game.name}`,
    `⏱️ ${formatTime(result.time)}` + (game.tracksMistakes ? `  💥 ${result.mistakes}` : ''),
    `🔥 ${streak}`,
    window.location.origin + window.location.pathname,
  ].join('\n')

  async function share() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy your result:', text)
    }
  }

  return (
    <div className="panel">
      <h3>Solved! 🎉</h3>
      <div className="stats">
        <div>
          <b>{formatTime(result.time)}</b>
          <span>time</span>
        </div>
        {game.tracksMistakes && (
          <div>
            <b>{result.mistakes}</b>
            <span>mistakes</span>
          </div>
        )}
        <div>
          <b>{streak}</b>
          <span>day streak</span>
        </div>
      </div>
      <button className="primary" onClick={share}>
        {copied ? 'Copied!' : 'Share result'}
      </button>
      <p className="muted">Next puzzle in {formatTime(msUntilTomorrow(new Date(now)))}</p>
    </div>
  )
}

function Daily({ today }) {
  const number = puzzleNumber(today)
  const key = dayKey(today)
  const game = gameForPuzzle(number)
  const [results, setResults] = useState(loadResults)
  const [playing] = useState(() => !loadResults()[key])
  const result = results[key]

  const finish = useCallback(
    (r) => {
      setResults((prev) => {
        const next = { ...prev, [key]: { ...r, game: game.id, number } }
        saveResults(next)
        return next
      })
    },
    [key, game.id, number],
  )

  return (
    <>
      {playing ? (
        <PuzzleRunner game={game} seed={`daily-${key}`} onFinish={finish} />
      ) : (
        <p className="rules">
          Today's puzzle was {game.emoji} {game.name}. Come back tomorrow for a new one!
        </p>
      )}
      {result && <DailyDone number={number} game={game} result={result} streak={currentStreak(results, today)} />}
    </>
  )
}

function Practice() {
  const [current, setCurrent] = useState(null)
  const [result, setResult] = useState(null)

  function start(game) {
    setResult(null)
    setCurrent({ game, seed: `practice-${Date.now()}-${Math.random()}` })
  }

  return (
    <>
      <p className="rules">Play any game as many times as you like. Practice doesn't affect your streak.</p>
      <div className="game-list">
        {GAMES.map((g) => (
          <button key={g.id} className={current?.game === g ? 'active' : ''} onClick={() => start(g)}>
            {g.emoji} {g.name}
          </button>
        ))}
      </div>
      {current && <PuzzleRunner key={current.seed} game={current.game} seed={current.seed} onFinish={setResult} />}
      {result && (
        <div className="panel">
          <h3>Solved in {formatTime(result.time)} 🎉</h3>
          <button className="primary" onClick={() => start(current.game)}>
            Play another
          </button>
        </div>
      )}
    </>
  )
}

export default function App() {
  const [today] = useState(() => new Date())
  const [tab, setTab] = useState('daily')

  // Reload when the day rolls over so a new puzzle appears.
  useEffect(() => {
    const id = setInterval(() => {
      if (dayKey(new Date()) !== dayKey(today)) window.location.reload()
    }, 30000)
    return () => clearInterval(id)
  }, [today])

  return (
    <main>
      <header>
        <div>
          <h1>Logicle</h1>
          <p className="muted">
            #{puzzleNumber(today)} ·{' '}
            {today.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <nav className="toggle">
          <button className={tab === 'daily' ? 'active' : ''} onClick={() => setTab('daily')}>
            Today
          </button>
          <button className={tab === 'practice' ? 'active' : ''} onClick={() => setTab('practice')}>
            Practice
          </button>
        </nav>
      </header>
      {tab === 'daily' ? <Daily today={today} /> : <Practice />}
    </main>
  )
}
