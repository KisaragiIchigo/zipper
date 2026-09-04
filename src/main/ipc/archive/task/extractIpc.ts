import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc'
import type { BatchExtractResult, ExtractResult } from '@shared/types'
import { extractArchive, type ExtractOptions } from '../../../sevenzip/extractArchive'
import { extractBatch, type BatchDestination } from '../../../sevenzip/extractBatch'
import { listArchive } from '../../../sevenzip/listArchive'
import { verifyPassword } from '../../../sevenzip/verifyPassword'
import { loadSettings } from '../../../settings/store'
import { askOverwrite } from './askOverwrite'
import { batchExtractSchema, extractArchiveSchema } from '../../schemas'
import { failureKindOf, runnerFor } from './runner'

export function registerExtractIpc(): void {
  ipcMain.handle(
    IPC.archiveExtractBatch,
    async (event, payload: unknown): Promise<BatchExtractResult> => {
      const runner = runnerFor(event.sender)
      const request = batchExtractSchema.parse(payload)
      const controller = runner.begin()

      const destination: BatchDestination =
        request.mode === 'fixed'
          ? { kind: 'fixed', path: request.destination ?? '' }
          : { kind: request.mode }

      try {
        const report = await extractBatch(request.archives, {
          destination,
          exclude: loadSettings().preferences.excludePatterns,
          signal: controller.signal,
          onProgress: runner.reportProgress,
          onOutcome: runner.reportOutcome,
          // 上書きの指定が最初から決まっている場合は尋ねない
          ...(request.overwrite === undefined
            ? {
                resolveOverwrite: (archive, conflicts) =>
                  askOverwrite(event.sender, archive, conflicts)
              }
            : {}),
          ...(request.overwrite === undefined ? {} : { overwrite: request.overwrite }),
          ...(request.password === undefined ? {} : { password: request.password })
        })

        // 全部が失敗した場合は、まとめて失敗として扱う
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

  ipcMain.handle(IPC.archiveExtract, async (event, payload: unknown): Promise<ExtractResult> => {
    const runner = runnerFor(event.sender)
    const request = extractArchiveSchema.parse(payload)
    const controller = runner.begin()

    const options: ExtractOptions = {
      destination: request.destination,
      signal: controller.signal,
      onProgress: runner.reportProgress,
      ...(request.totalFiles === undefined ? {} : { total: request.totalFiles }),
      // 選んで取り出すときは選択をそのまま尊重する。除外は書庫全体を取り出すときだけ
      ...(request.entries === undefined || request.entries.length === 0
        ? { exclude: loadSettings().preferences.excludePatterns }
        : { entries: request.entries }),
      ...(request.renames === undefined || request.renames.length === 0
        ? {}
        : { renames: request.renames }),
      ...(request.overwrite === undefined ? {} : { overwrite: request.overwrite }),
      ...(request.password === undefined ? {} : { password: request.password })
    }

    try {
      // 鍵の要る書庫は、宛先へ書き始める前に確かめる。違っていれば何も生まれない
      if (request.hasEncryptedEntry === true) {
        const info = await listArchive(
          request.path,
          request.password === undefined ? {} : { password: request.password }
        )
        await verifyPassword(info.path, info.entries, request.password)
      }

      await extractArchive(request.path, options)
      return { ok: true, destination: request.destination }
    } catch (error) {
      return { ok: false, kind: failureKindOf(error, controller.signal.aborted) }
    } finally {
      runner.finish(controller)
    }
  })
}
