import { ipcMain, type WebContents } from 'electron'
import { IPC } from '@shared/ipc'
import type { ModifyArchiveResult, TaskProgress } from '@shared/types'
import { addToArchive, deleteFromArchive } from '../../../sevenzip/modifyArchive'
import { modifyArchiveSchema } from '../../schemas'
import { acquireWrite, releaseWrite } from '../../../sevenzip/writeLock'
import { failureKindOf, runnerFor } from './runner'

type Apply = (
  path: string,
  targets: string[],
  options: {
    password?: string
    onProgress: (progress: TaskProgress) => void
    total: number
    signal: AbortSignal
  }
) => Promise<void>

/** 既存の書庫にファイルを足す、あるいは取り除く */
export function registerModifyIpc(): void {
  const handle = async (
    contents: WebContents,
    payload: unknown,
    apply: Apply
  ): Promise<ModifyArchiveResult> => {
    const runner = runnerFor(contents)
    const request = modifyArchiveSchema.parse(payload)

    // 同じ書庫を別の窓が書き換えている最中に重ねると、中身が壊れる
    if (!acquireWrite(request.path)) return { ok: false, kind: 'busy' }

    const controller = runner.begin()

    try {
      await apply(request.path, request.targets, {
        signal: controller.signal,
        onProgress: runner.reportProgress,
        total: request.targets.length,
        ...(request.password === undefined ? {} : { password: request.password })
      })
      return { ok: true }
    } catch (error) {
      return { ok: false, kind: failureKindOf(error, controller.signal.aborted) }
    } finally {
      runner.finish(controller)
      releaseWrite(request.path)
    }
  }

  ipcMain.handle(IPC.archiveAdd, (event, payload: unknown) =>
    handle(event.sender, payload, (path, targets, options) => addToArchive(path, targets, options))
  )

  ipcMain.handle(IPC.archiveDelete, (event, payload: unknown) =>
    handle(event.sender, payload, (path, targets, options) =>
      deleteFromArchive(path, targets, options)
    )
  )
}
