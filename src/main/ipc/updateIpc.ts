import { app, ipcMain } from 'electron'
import { IPC } from '@shared/ipc'
import { loadSettings } from '../settings/store'
import { UpdateService } from '../updater/updateService'

/** 起動直後は画面の準備を優先し、少し置いてから確認する */
const INITIAL_CHECK_DELAY_MS = 4000

export function registerUpdateIpc(): void {
  const service = new UpdateService()

  ipcMain.handle(IPC.appVersion, () => app.getVersion())
  ipcMain.handle(IPC.updateCheck, () => service.check())
  ipcMain.on(IPC.updateDownload, () => service.download())
  ipcMain.on(IPC.updateInstall, () => service.install())

  // 配布物のときだけ、起動後に一度だけ様子を見る
  if (app.isPackaged && loadSettings().preferences.checkUpdateOnStartup) {
    setTimeout(() => {
      void service.check()
    }, INITIAL_CHECK_DELAY_MS)
  }
}
