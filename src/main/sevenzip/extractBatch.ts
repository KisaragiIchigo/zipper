import { basename, dirname, join } from 'node:path'
import { archiveStem } from '@shared/archiveNames'
import type { ArchiveFailureKind, ArchiveOutcome, OverwriteMode, TaskProgress } from '@shared/types'
import { ArchiveFailure } from './ArchiveFailure'
import { ExtractCancelled } from './ExtractCancelled'
import { extractOne } from './extract/extractOne'
import { resolveVolumeSets } from './volumeSets'

/** 解凍先の決め方 */
export type BatchDestination =
  /** 書庫と同じ場所 */
  | { kind: 'here' }
  /** 書庫と同じ場所に、書庫名のフォルダを作る */
  | { kind: 'folder' }
  /** 指定した 1 箇所へまとめる */
  | { kind: 'fixed'; path: string }

export interface BatchExtractOptions {
  destination: BatchDestination
  overwrite?: OverwriteMode
  password?: string
  /** 取り出さないファイル名 */
  exclude?: readonly string[]
  onProgress?: (progress: TaskProgress) => void
  /** 書庫 1 つ分が終わるたびに呼ばれる */
  onOutcome?: (outcome: ArchiveOutcome) => void
  /**
   * 展開先に同じ名前のものがあったときに呼ばれる。
   * 答えは以降の書庫にも使う。まとめて取り出すたびに何度も尋ねないため。
   * null が返れば、残りの書庫も含めて取りやめる。
   */
  resolveOverwrite?: (archive: string, conflicts: readonly string[]) => Promise<OverwriteMode | null>
  signal?: AbortSignal
}

export interface BatchExtractResult {
  /** 最初に書き出した場所。結果の案内に使う */
  destination: string
  succeeded: number
  failures: { path: string; kind: ArchiveFailureKind | 'cancelled' }[]
}

function resolveDestination(archivePath: string, destination: BatchDestination): string {
  switch (destination.kind) {
    case 'fixed':
      return destination.path
    case 'here':
      return dirname(archivePath)
    case 'folder':
      return join(dirname(archivePath), archiveStem(basename(archivePath)))
  }
}

/**
 * 複数の書庫を順に取り出す。
 *
 * 1 つが失敗しても残りは続ける。まとめて選んだうちの 1 つが壊れていただけで
 * 全部が中断されると、どれが処理されたのか分からなくなるため。
 * 分割書庫は先頭の巻へ読み替えたうえで重複を除き、同じ書庫を二度取り出さない。
 */
export async function extractBatch(
  archives: readonly string[],
  options: BatchExtractOptions
): Promise<BatchExtractResult> {
  const targets = await resolveVolumeSets(archives)
  const failures: BatchExtractResult['failures'] = []
  let succeeded = 0
  let firstDestination = ''
  // 一度答えてもらったら、それを残りの書庫にも使う
  let decided = options.overwrite

  for (const [index, archivePath] of targets.entries()) {
    if (options.signal?.aborted === true) {
      failures.push({ path: archivePath, kind: 'cancelled' })
      options.onOutcome?.({
        index: index + 1,
        total: targets.length,
        name: basename(archivePath),
        path: archivePath,
        ok: false,
        kind: 'cancelled'
      })
      continue
    }

    const destination = resolveDestination(archivePath, options.destination)
    if (firstDestination === '') firstDestination = destination

    const position = { index: index + 1, total: targets.length, name: basename(archivePath) }

    const wasAborted = (): boolean => options.signal?.aborted === true
    const report =
      options.onProgress === undefined
        ? undefined
        : (progress: TaskProgress) => options.onProgress?.({ ...progress, archive: position })

    const ask = options.resolveOverwrite
    const onConflict =
      ask === undefined
        ? undefined
        : async (conflicts: readonly string[]): Promise<OverwriteMode | null> => {
            if (decided !== undefined) return decided
            const answer = await ask(position.name, conflicts)
            if (answer !== null) decided = answer
            return answer
          }

    try {
      await extractOne(archivePath, destination, {
        ...(options.exclude === undefined ? {} : { exclude: options.exclude }),
        ...(decided === undefined ? {} : { overwrite: decided }),
        ...(options.password === undefined ? {} : { password: options.password }),
        ...(options.signal === undefined ? {} : { signal: options.signal }),
        ...(onConflict === undefined ? {} : { onConflict }),
        ...(report === undefined ? {} : { onProgress: report })
      })
      succeeded += 1
      options.onOutcome?.({ ...position, path: archivePath, ok: true })
    } catch (error) {
      const cancelled = error instanceof ExtractCancelled || wasAborted()
      const raw = error instanceof ArchiveFailure ? error.kind : 'unknown'
      const kind = cancelled ? 'cancelled' : raw
      failures.push({ path: archivePath, kind })
      options.onOutcome?.({ ...position, path: archivePath, ok: false, kind })

      // やめると答えられたなら、残りの書庫にも手を付けない
      if (error instanceof ExtractCancelled) break
    }
  }

  return { destination: firstDestination, succeeded, failures }
}
