import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc'
import { registerCreateIpc } from './task/createIpc'
import { registerExtractIpc } from './task/extractIpc'
import { registerModifyIpc } from './task/modifyIpc'
import { runnerFor } from './task/runner'
import { registerTestIpc } from './task/testIpc'
import { registerViewIpc } from './task/viewIpc'

/**
 * 時間のかかる作業の登録。
 * 進行と中断は要求してきた窓ごとの runner が受け持つ。
 */
export function registerTaskIpc(): void {
  registerExtractIpc()
  registerCreateIpc()
  registerTestIpc()
  registerModifyIpc()
  registerViewIpc()

  ipcMain.on(IPC.archiveTaskCancel, (event) => runnerFor(event.sender).cancel())
}
