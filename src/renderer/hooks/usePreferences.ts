import { useCallback, useEffect, useState } from 'react'
import type { AppPreferences } from '@shared/types'

export interface PreferencesController {
  /** 読み込みが終わるまでは null */
  preferences: AppPreferences | null
  update: <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => void
}

/**
 * 設定を読み書きする。
 * 画面の反応を止めないよう、手元の値をすぐ書き換えてから保存を投げる。
 */
export function usePreferences(active: boolean): PreferencesController {
  const [preferences, setPreferences] = useState<AppPreferences | null>(null)

  useEffect(() => {
    if (!active) return
    void window.zipper.preferences.get().then(setPreferences)
  }, [active])

  const update = useCallback(
    <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]) => {
      setPreferences((current) => {
        if (current === null) return current
        const next = { ...current, [key]: value }
        void window.zipper.preferences.set(next)
        return next
      })
    },
    []
  )

  return { preferences, update }
}
