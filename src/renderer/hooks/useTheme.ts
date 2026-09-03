import { useCallback, useEffect, useState } from 'react'
import type { ThemeMode, ThemeState } from '@shared/types'

const INITIAL: ThemeState = { mode: 'system', resolved: 'light' }

/**
 * テーマは Main の nativeTheme が単一情報源。
 * Renderer は解決済みの値を受け取って html の dark クラスへ反映するだけに徹する。
 */
export function useTheme(): { theme: ThemeState; setMode: (mode: ThemeMode) => void } {
  const [theme, setTheme] = useState<ThemeState>(INITIAL)

  useEffect(() => {
    void window.zipper.theme.get().then(setTheme)
    return window.zipper.theme.onChanged(setTheme)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme.resolved === 'dark')
  }, [theme.resolved])

  const setMode = useCallback((mode: ThemeMode) => {
    void window.zipper.theme.set(mode).then(setTheme)
  }, [])

  return { theme, setMode }
}
