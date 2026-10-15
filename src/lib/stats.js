import { dayKey } from './daily'

const STORAGE_KEY = 'logicle-results'

export function loadResults() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

export function saveResults(results) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(results))
  } catch {
    // Storage unavailable (private mode etc.) — results just won't persist.
  }
}

// Consecutive solved days ending today (or yesterday, if today isn't solved yet).
export function currentStreak(results, today) {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (!results[dayKey(d)]) d.setDate(d.getDate() - 1)
  let streak = 0
  while (results[dayKey(d)]) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}
