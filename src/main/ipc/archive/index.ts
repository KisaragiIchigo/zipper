import { registerDialogIpc } from './dialogIpc'
import { registerListIpc } from './listIpc'
import { registerTaskIpc } from './taskIpc'

/** 書庫まわりの IPC 登録。責務ごとの実装は各モジュールが持つ */
export function registerArchiveIpc(): void {
  registerListIpc()
  registerTaskIpc()
  registerDialogIpc()
}
