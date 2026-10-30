import { useEffect, useRef } from 'react'
import { App as NativeApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle } from '@capacitor/haptics'
import { Share } from '@capacitor/share'

// Everything that differs between the website and the phone app lives here.
export const isNative = Capacitor.isNativePlatform()

// The app runs from https://localhost, so shared results link to the website instead.
export const shareUrl = () =>
  isNative ? 'https://ahmad1827.github.io/Logicle/' : window.location.origin + window.location.pathname

export function vibrate() {
  if (isNative) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})
  else navigator.vibrate?.(15)
}

// Rejects when the user dismisses the share sheet, which isn't an error.
export const nativeShare = (text) => Share.share({ text }).catch(() => {})

const backClosers = []

// While mounted, the Android back button calls `close` instead of leaving the screen.
export function useBackCloses(close) {
  const latest = useRef(close)
  latest.current = close
  useEffect(() => {
    const closer = () => latest.current()
    backClosers.push(closer)
    return () => {
      backClosers.splice(backClosers.indexOf(closer), 1)
    }
  }, [])
}

// `goBack` runs when nothing is open to close; it returns false if there's nowhere left to go.
export function useBackButton(goBack) {
  const latest = useRef(goBack)
  latest.current = goBack
  useEffect(() => {
    if (!isNative) return
    const listener = NativeApp.addListener('backButton', () => {
      if (backClosers.length) backClosers.at(-1)()
      else if (latest.current() === false) NativeApp.minimizeApp()
    })
    return () => {
      listener.then((l) => l.remove())
    }
  }, [])
}
