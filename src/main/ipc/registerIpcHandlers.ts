import { registerArchiveIpc } from './archive'
import { registerPreferencesIpc } from './preferencesIpc'
import { registerSevenZipIpc } from './sevenZipIpc'
import { registerShellIpc } from './shellIpc'
import { registerThemeIpc } from './themeIpc'
import { registerUpdateIpc } from './updateIpc'
import { registerWindowIpc } from './windowIpc'

/**
 * IPC ハンドラ登録のオーケストレータ。個々の実装は各モジュールが持つ。
 * 登録はアプリ全体で 1 度だけ行い、どの窓からの要求かは各ハンドラが event から解決する。
 */
export function registerIpcHandlers(): void {
  registerThemeIpc()
  registerPreferencesIpc()
  registerSevenZipIpc()
  registerArchiveIpc()
  registerShellIpc()
  registerUpdateIpc()
  registerWindowIpc()
}
