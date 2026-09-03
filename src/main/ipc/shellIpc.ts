import { stat } from 'node:fs/promises'
import { BrowserWindow, clipboard, ipcMain, shell } from 'electron'
import { IPC } from '@shared/ipc'
import type { ShellIntegrationStatus } from '@shared/types'
import {
  registerShellIntegration,
  shellIntegrationStatus,
  unregisterShellIntegration
} from '../shell/applyIntegration'

export function registerShellIpc(): void {
  ipcMain.on(IPC.appClose, (event) => {
    const target = BrowserWindow.fromWebContents(event.sender)
    if (target !== null && !target.isDestroyed()) target.close()
  })

  ipcMain.on(IPC.shellReveal, (_event, path: unknown) => {
    if (typeof path !== 'string' || path === '') return

    void (async () => {
      const info = await stat(path).catch(() => null)
      if (info === null) return
      // フォルダはそのまま開き、ファイルは親フォルダで選択された状態にする
      if (info.isDirectory()) await shell.openPath(path)
      else shell.showItemInFolder(path)
    })()
  })

  ipcMain.on(IPC.clipboardWrite, (_event, text: unknown) => {
    if (typeof text === 'string' && text !== '') clipboard.writeText(text)
  })

  ipcMain.handle(IPC.shellIntegrationStatus, () => shellIntegrationStatus())

  ipcMain.handle(IPC.shellRegister, async (): Promise<ShellIntegrationStatus> => {
    await registerShellIntegration()
    return shellIntegrationStatus()
  })

  ipcMain.handle(IPC.shellUnregister, async (): Promise<ShellIntegrationStatus> => {
    await unregisterShellIntegration()
    return shellIntegrationStatus()
  })
}
