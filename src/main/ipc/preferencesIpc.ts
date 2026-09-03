import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc'
import type { AppPreferences } from '@shared/types'
import { preferencesSchema } from '../settings/schema'
import { loadSettings, updateSettings } from '../settings/store'

/** 設定画面から変えられる項目の読み書き */
export function registerPreferencesIpc(): void {
  ipcMain.handle(IPC.preferencesGet, (): AppPreferences => loadSettings().preferences)

  ipcMain.handle(IPC.preferencesSet, (_event, payload: unknown): AppPreferences => {
    const next = preferencesSchema.parse(payload)
    updateSettings({ preferences: next })
    return next
  })
}
