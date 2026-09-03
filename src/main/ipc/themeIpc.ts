import { BrowserWindow, ipcMain, nativeTheme } from 'electron'
import { IPC } from '@shared/ipc'
import type { ThemeState } from '@shared/types'
import { updateSettings } from '../settings/store'
import { titleBarOverlayFor } from '../window/titleBarOverlay'
import { themeModeSchema } from './schemas'

function currentThemeState(): ThemeState {
  return {
    mode: nativeTheme.themeSource,
    resolved: nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  }
}

export function registerThemeIpc(): void {
  ipcMain.handle(IPC.themeGet, () => currentThemeState())

  ipcMain.handle(IPC.themeSet, (_event, payload: unknown) => {
    const mode = themeModeSchema.parse(payload)
    nativeTheme.themeSource = mode
    updateSettings({ themeMode: mode })
    return currentThemeState()
  })

  // OS のテーマ変更とアプリ側の変更、どちらもここに集約される
  nativeTheme.on('updated', () => {
    const state = currentThemeState()
    // 外観はアプリ全体で揃える。開いているすべての窓へ同じ変更を届ける
    for (const target of BrowserWindow.getAllWindows()) {
      if (target.isDestroyed()) continue
      target.setTitleBarOverlay(titleBarOverlayFor(state.resolved === 'dark'))
      target.setBackgroundColor(state.resolved === 'dark' ? '#202020' : '#f3f3f3')
      target.webContents.send(IPC.themeChanged, state)
    }
  })
}
