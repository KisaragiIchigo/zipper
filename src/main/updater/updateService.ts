import { app, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import { IPC } from '@shared/ipc'
import type { UpdateStatus } from '@shared/types'

/**
 * GitHub の Releases を見て、より新しい版があるかを調べる。
 *
 * 取得は自動で始めない。回線を勝手に使わず、利用者が決めてから動かす。
 * 開発中は配布物としての体裁が無く判定できないため、その旨を返して何もしない。
 */
export class UpdateService {
  private status: UpdateStatus = app.isPackaged ? { phase: 'idle' } : { phase: 'unavailable-in-dev' }

  constructor() {
    autoUpdater.autoDownload = false
    autoUpdater.autoInstallOnAppQuit = true

    autoUpdater.on('update-available', (info) => {
      this.publish({
        phase: 'available',
        version: info.version,
        releaseDate: info.releaseDate ?? null
      })
    })

    autoUpdater.on('update-not-available', () => {
      this.publish({ phase: 'up-to-date', currentVersion: app.getVersion() })
    })

    autoUpdater.on('download-progress', (progress) => {
      const version = this.status.phase === 'available' ? this.status.version : ''
      this.publish({
        phase: 'downloading',
        version: version === '' ? app.getVersion() : version,
        percent: Math.round(progress.percent)
      })
    })

    autoUpdater.on('update-downloaded', (info) => {
      this.publish({ phase: 'ready', version: info.version })
    })

    autoUpdater.on('error', (error) => {
      this.publish({ phase: 'failed', message: error.message })
    })
  }

  /** 更新はアプリ全体の話なので、開いているすべての窓へ知らせる */
  private publish(next: UpdateStatus): void {
    this.status = next
    for (const target of BrowserWindow.getAllWindows()) {
      if (!target.isDestroyed()) target.webContents.send(IPC.updateStatus, next)
    }
  }

  current(): UpdateStatus {
    return this.status
  }

  async check(): Promise<UpdateStatus> {
    if (!app.isPackaged) {
      this.status = { phase: 'unavailable-in-dev' }
      return this.status
    }

    this.publish({ phase: 'checking' })
    try {
      await autoUpdater.checkForUpdates()
    } catch (error) {
      this.publish({
        phase: 'failed',
        message: error instanceof Error ? error.message : '更新を確認できませんでした。'
      })
    }
    return this.status
  }

  download(): void {
    if (this.status.phase !== 'available') return
    this.publish({ phase: 'downloading', version: this.status.version, percent: 0 })
    void autoUpdater.downloadUpdate().catch((error: unknown) => {
      this.publish({
        phase: 'failed',
        message: error instanceof Error ? error.message : '更新を取得できませんでした。'
      })
    })
  }

  install(): void {
    if (this.status.phase !== 'ready') return
    // 取得済みの更新を当てて再起動する。ここでアプリは終了する
    autoUpdater.quitAndInstall()
  }
}
