import { basename } from 'node:path'
import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc'
import type { CreateArchiveResult, CreateBatchResult } from '@shared/types'
import { createArchive, type CreateArchiveOptions } from '../../../sevenzip/createArchive'
import { createBatch } from '../../../sevenzip/createBatch'
import { createSelfExtracting } from '../../../sevenzip/createSelfExtracting'
import { acquireWrite, releaseWrite } from '../../../sevenzip/writeLock'
import { loadSettings } from '../../../settings/store'
import { createArchiveSchema, createBatchSchema } from '../../schemas'
import { failureKindOf, runnerFor } from './runner'

export function registerCreateIpc(): void {
  ipcMain.handle(
    IPC.archiveCreate,
    async (event, payload: unknown): Promise<CreateArchiveResult> => {
      const runner = runnerFor(event.sender)
      const request = createArchiveSchema.parse(payload)

      // 同じ場所へ 2 か所から書き出すと、できあがる書庫が壊れる
      if (!acquireWrite(request.destination)) return { ok: false, kind: 'busy' }

      const controller = runner.begin()
      // 記録にどの書庫を作っているかを残す。解凍と同じ見え方に揃える
      const position = { index: 1, total: 1, name: basename(request.destination) }

      const options: CreateArchiveOptions = {
        format: request.format,
        level: request.level,
        signal: controller.signal,
        onProgress: (progress) => runner.reportProgress({ ...progress, archive: position }),
        total: request.sources.length,
        exclude: loadSettings().preferences.excludePatterns,
        ...(request.password === undefined ? {} : { password: request.password }),
        ...(request.encryptHeader === undefined ? {} : { encryptHeader: request.encryptHeader }),
        ...(request.zipEncryption === undefined ? {} : { zipEncryption: request.zipEncryption }),
        ...(request.volumeSize === undefined ? {} : { volumeSize: request.volumeSize })
      }

      try {
        // 自己解凍は 7z 書庫を作ってから実行部と結合するため、経路を分ける
        const produced =
          request.selfExtracting === true
            ? await createSelfExtracting(request.sources, request.destination, options)
            : await createArchive(request.sources, request.destination, options)
        return { ok: true, destination: produced }
      } catch (error) {
        return { ok: false, kind: failureKindOf(error, controller.signal.aborted) }
      } finally {
        runner.finish(controller)
        releaseWrite(request.destination)
      }
    }
  )

  ipcMain.handle(
    IPC.archiveCreateBatch,
    async (event, payload: unknown): Promise<CreateBatchResult> => {
      const runner = runnerFor(event.sender)
      const request = createBatchSchema.parse(payload)
      const controller = runner.begin()

      try {
        // 書き出し先ごとのロックは createBatch が 1 つずつ取る
        const report = await createBatch(request.sources, {
          destination: request.destination,
          format: request.format,
          level: request.level,
          exclude: loadSettings().preferences.excludePatterns,
          signal: controller.signal,
          onProgress: runner.reportProgress,
          onOutcome: runner.reportOutcome,
          ...(request.password === undefined ? {} : { password: request.password }),
          ...(request.encryptHeader === undefined ? {} : { encryptHeader: request.encryptHeader }),
          ...(request.zipEncryption === undefined ? {} : { zipEncryption: request.zipEncryption }),
          ...(request.volumeSize === undefined ? {} : { volumeSize: request.volumeSize }),
          ...(request.selfExtracting === undefined
            ? {}
            : { selfExtracting: request.selfExtracting })
        })

        // 1 つも作れなかった場合は、まとめて失敗として扱う
        if (report.succeeded === 0 && report.failures.length > 0) {
          return { ok: false, kind: report.failures[0]?.kind ?? 'unknown' }
        }
        return {
          ok: true,
          destination: report.destination,
          succeeded: report.succeeded,
          failed: report.failures.length
        }
      } catch (error) {
        return { ok: false, kind: failureKindOf(error, controller.signal.aborted) }
      } finally {
        runner.finish(controller)
      }
    }
  )
}
