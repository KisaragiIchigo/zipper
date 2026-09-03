import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc'
import type { TestArchiveResult } from '@shared/types'
import { testArchive } from '../../../sevenzip/testArchive'
import { testArchiveSchema } from '../../schemas'
import { failureKindOf, runnerFor } from './runner'

export function registerTestIpc(): void {
  ipcMain.handle(IPC.archiveTest, async (event, payload: unknown): Promise<TestArchiveResult> => {
    const runner = runnerFor(event.sender)
    const request = testArchiveSchema.parse(payload)
    const controller = runner.begin()

    try {
      const report = await testArchive(request.path, {
        signal: controller.signal,
        onProgress: runner.reportProgress,
        ...(request.totalFiles === undefined ? {} : { total: request.totalFiles }),
        ...(request.password === undefined ? {} : { password: request.password })
      })
      return { ok: true, failures: report.failures }
    } catch (error) {
      return { ok: false, kind: failureKindOf(error, controller.signal.aborted) }
    } finally {
      runner.finish(controller)
    }
  })
}
