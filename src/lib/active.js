import { createContext, useContext } from 'react'

// Daily and Practice both stay mounted so neither loses its board when you switch.
// This tells a game whether its tab is the one on screen, so hidden boards ignore the keyboard.
export const ActiveContext = createContext(true)

export const useActive = () => useContext(ActiveContext)
