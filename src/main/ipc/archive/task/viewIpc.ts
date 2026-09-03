import { app, ipcMain } from 'electron'
import { IPC } from '@shared/ipc'
import type { OpenEntryResult, PreviewResult } from '@shared/types'
import { stageForDrag } from '../../../sevenzip/dragOut'
import { openArchiveEntry } from '../../../sevenzip/openEntry'
import { previewArchiveEntry } from '../../../sevenzip/previewEntry'
import { openEntrySchema, previewSchema, startDragSchema } from '../../schemas'
import { failureKindOf } from './runner'

/**
 * 中身を 1 件だけ見るための経路。
 * どちらも短時間で終わるため、進行中の展開や圧縮とは競合させない。
 */
export function registerViewIpc(): void {
  ipcMain.handle(IPC.archiveOpenEntry, async (_event, payload: unknown): Promise<OpenEntryResult> => {
    const request = openEntrySchema.parse(payload)

    try {
      await openArchiveEntry(request.path, {
        entry: request.entry,
        displayPath: request.displayPath,
        ...(request.password === undefined ? {} : { password: request.password })
      })
      return { ok: true }
    } catch (error) {
      return { ok: false, kind: failureKindOf(error, false) }
    }
  })

  ipcMain.handle(IPC.archivePreview, async (_event, payload: unknown): Promise<PreviewResult> => {
    const request = previewSchema.parse(payload)

    try {
      const content = await previewArchiveEntry(request.path, {
        entry: request.entry,
        displayPath: request.displayPath,
        size: request.size,
        ...(request.password === undefined ? {} : { password: request.password })
      })
      return { ok: true, content }
    } catch (error) {
      return { ok: false, kind: failureKindOf(error, false) }
    }
  })

  // エクスプローラーへ引き渡せるのは実体のあるファイルだけなので、掴んだ時点で書き出す。
  // 書き出しが終わる前にマウスを離された場合はドラッグが始まらないだけで、害はない
  ipcMain.on(IPC.archiveStartDrag, (event, payload: unknown) => {
    const request = startDragSchema.parse(payload)

    void (async () => {
      const files = await stageForDrag(
        request.path,
        request.targets,
        request.password === undefined ? undefined : request.password
      )
      const first = files[0]
      if (first === undefined || event.sender.isDestroyed()) return

      // 引きずっている間に見えるのは OS が持つそのファイルの絵
      const icon = await app.getFileIcon(first, { size: 'normal' })
      // file は 1 件だけの経路で、files が複数選択の経路。型の都合で両方を渡す
      event.sender.startDrag({ file: first, files, icon })
    })()
  })
}
