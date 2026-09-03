import { ipcMain } from 'electron'
import { IPC } from '@shared/ipc'
import type { ArchiveResult } from '@shared/types'
import { ArchiveFailure } from '../../sevenzip/ArchiveFailure'
import { findConflicts } from '../../sevenzip/findConflicts'
import { listArchive, type ListOptions } from '../../sevenzip/listArchive'
import { resolveFirstVolume } from '../../sevenzip/volumeSets'
import { takePendingFor } from '../../window/windowManager'
import { conflictQuerySchema, openArchiveSchema } from '../schemas'

/** 書庫を開く・起動要求を引き取る・展開先の衝突を調べる */
export function registerListIpc(): void {
  ipcMain.handle(IPC.archiveOpen, async (_event, payload: unknown): Promise<ArchiveResult> => {
    const request = openArchiveSchema.parse(payload)

    // exactOptionalPropertyTypes のため、未指定のキーは渡さない
    const options: ListOptions = {
      ...(request.codepage === undefined ? {} : { codepage: request.codepage }),
      ...(request.password === undefined ? {} : { password: request.password })
    }

    try {
      return { ok: true, info: await listArchive(request.path, options) }
    } catch (error) {
      if (error instanceof ArchiveFailure) return { ok: false, kind: error.kind }
      return { ok: false, kind: 'unknown' }
    }
  })

  ipcMain.handle(IPC.archiveResolvePath, (_event, path: unknown) =>
    typeof path === 'string' && path !== '' ? resolveFirstVolume(path) : ''
  )

  ipcMain.handle(IPC.archivePending, (event) => takePendingFor(event.sender))

  ipcMain.handle(IPC.archiveCheckConflicts, async (_event, payload: unknown): Promise<string[]> => {
    const query = conflictQuerySchema.parse(payload)
    return findConflicts(query.destination, query.entries)
  })
}
