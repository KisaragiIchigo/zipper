import { access } from 'node:fs/promises'
import { basename, join } from 'node:path'
import type {
  ArchiveFailureKind,
  ArchiveFormat,
  ArchiveOutcome,
  CompressionLevel,
  TaskProgress,
  ZipEncryption
} from '@shared/types'
import { ArchiveFailure } from './ArchiveFailure'
import { archiveNameFor } from './create/archiveNameFor'
import { createArchive, type CreateArchiveOptions } from './createArchive'
import { createSelfExtracting } from './createSelfExtracting'
import { acquireWrite, releaseWrite } from './writeLock'

export interface CreateBatchOptions {
  /** 書庫を並べて置く場所 */
  destination: string
  format: ArchiveFormat
  level: CompressionLevel
  password?: string
  encryptHeader?: boolean
  zipEncryption?: ZipEncryption
  volumeSize?: string
  /** 7z のみ。実行するだけで展開できる exe にする */
  selfExtracting?: boolean
  /** 書庫へ入れないファイル名 */
  exclude?: readonly string[]
  onProgress?: (progress: TaskProgress) => void
  /** 書庫 1 つ分が終わるたびに呼ばれる */
  onOutcome?: (outcome: ArchiveOutcome) => void
  signal?: AbortSignal
}

export interface CreateBatchReport {
  /** 書庫を並べた場所。結果の案内に使う */
  destination: string
  succeeded: number
  failures: { path: string; kind: ArchiveFailureKind | 'cancelled' }[]
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

/**
 * まだ誰も使っていない名前にする。
 *
 * 7-Zip の a は既にある書庫へ追加する動きをするため、名前が重なると
 * 別の対象の中身が同じ書庫へ混ざる。フォルダの A と ファイルの A.txt のように、
 * 元の名前が違っても書庫名は重なりうるので、番号を足して分ける。
 */
async function uniquePath(
  directory: string,
  stem: string,
  extension: string,
  taken: Set<string>
): Promise<string> {
  for (let counter = 1; ; counter += 1) {
    const name = counter === 1 ? stem + extension : stem + ' (' + counter + ')' + extension
    const candidate = join(directory, name)

    if (!taken.has(name.toLowerCase()) && !(await exists(candidate))) {
      taken.add(name.toLowerCase())
      return candidate
    }
  }
}

/**
 * 対象ごとに別々の書庫を作る。
 *
 * フォルダをまとめて選んだときに、1 つの書庫へ束ねるのではなく
 * フォルダの数だけ書庫を並べたい、という使い方を受け持つ。
 * 1 つが失敗しても残りは続ける。どれが作れてどれが駄目だったかを追えるようにするため。
 */
export async function createBatch(
  sources: readonly string[],
  options: CreateBatchOptions
): Promise<CreateBatchReport> {
  const failures: CreateBatchReport['failures'] = []
  const taken = new Set<string>()
  let succeeded = 0

  // 待っている間に取り消されうるため、そのつど読み直す
  const wasAborted = (): boolean => options.signal?.aborted === true

  for (const [index, source] of sources.entries()) {
    const position = { index: index + 1, total: sources.length, name: basename(source) }

    if (wasAborted()) {
      failures.push({ path: source, kind: 'cancelled' })
      options.onOutcome?.({ ...position, path: source, ok: false, kind: 'cancelled' })
      continue
    }

    const name = await archiveNameFor(source, options.format)
    // 自己解凍は 7z 書庫に実行部を繋いだ exe になる
    const sfx = options.selfExtracting === true && options.format === '7z'
    const target = await uniquePath(
      options.destination,
      name.stem,
      sfx ? '.exe' : name.extension,
      taken
    )

    // 進捗と記録は、できあがる書庫の名前で見せる
    const label = { ...position, name: basename(target) }
    const report =
      options.onProgress === undefined
        ? undefined
        : (progress: TaskProgress) => options.onProgress?.({ ...progress, archive: label })

    if (!acquireWrite(target)) {
      failures.push({ path: source, kind: 'busy' })
      options.onOutcome?.({ ...label, path: target, ok: false, kind: 'busy' })
      continue
    }

    const createOptions: CreateArchiveOptions = {
      format: options.format,
      level: options.level,
      total: 1,
      ...(options.exclude === undefined ? {} : { exclude: options.exclude }),
      ...(options.password === undefined ? {} : { password: options.password }),
      ...(options.encryptHeader === undefined ? {} : { encryptHeader: options.encryptHeader }),
      ...(options.zipEncryption === undefined ? {} : { zipEncryption: options.zipEncryption }),
      // 自己解凍は先頭のファイルだけが実行できるため、分割とは併用しない
      ...(options.volumeSize === undefined || sfx ? {} : { volumeSize: options.volumeSize }),
      ...(options.signal === undefined ? {} : { signal: options.signal }),
      ...(report === undefined ? {} : { onProgress: report })
    }

    try {
      const produced = sfx
        ? await createSelfExtracting([source], target, createOptions)
        : await createArchive([source], target, createOptions)

      succeeded += 1
      options.onOutcome?.({ ...label, path: produced, ok: true })
    } catch (error) {
      const cancelled = wasAborted()
      const raw = error instanceof ArchiveFailure ? error.kind : 'unknown'
      const kind = cancelled ? 'cancelled' : raw

      failures.push({ path: source, kind })
      options.onOutcome?.({ ...label, path: target, ok: false, kind })

      // 中止を選ばれたなら、残りの対象にも手を付けない
      if (cancelled) break
    } finally {
      releaseWrite(target)
    }
  }

  return { destination: options.destination, succeeded, failures }
}
