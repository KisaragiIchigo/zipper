import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc'
import { probeSevenZip } from '../sevenzip/probe'

export function registerSevenZipIpc(): void {
  ipcMain.handle(IPC.sevenZipProbe, () => probeSevenZip())
}
