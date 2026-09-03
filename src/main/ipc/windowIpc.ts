import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc'
import { openWindow } from '../window/windowManager'

/** 窓を増やす要求。書庫は 1 つにつき 1 窓で開く */
export function registerWindowIpc(): void {
  ipcMain.on(IPC.windowOpen, (_event, paths: unknown) => {
    if (!Array.isArray(paths)) return

    for (const path of paths) {
      if (typeof path !== 'string' || path === '') continue
      openWindow({ action: 'open', paths: [path] })
    }
  })
}
