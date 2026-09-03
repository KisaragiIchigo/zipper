import type { OverwriteMode, TaskProgress } from '@shared/types'
import { ExtractCancelled } from '../ExtractCancelled'
import { extractArchive } from '../extractArchive'
import { findConflicts } from '../findConflicts'
import { listArchive } from '../listArchive'
import { scaleProgress } from '../scaleProgress'
import { tarInsideName, unwrapTar } from './unwrapTar'

/** 外側を解く工程が全体に占める割合。TAR を開き直す分を後ろに残す */
const OUTER_SHARE = 70

export interface ExtractOneOptions {
  overwrite?: OverwriteMode
  password?: string
  /** 取り出さないファイル名 */
  exclude?: readonly string[]
  /**
   * 展開先に同じ名前のものがあったときに呼ばれる。
   * null が返れば取りやめる。未指定なら黙って上書きする。
   */
  onConflict?: (conflicts: readonly string[]) => Promise<OverwriteMode | null>
  onProgress?: (progress: TaskProgress) => void
  signal?: AbortSignal
}

/**
 * 書庫 1 つを取り出す。
 *
 * 中身が TAR ひとつだけの場合は続けてそれも開く。GZIP や XZ で包まれた
 * 書庫は二重になっており、外側を解いただけでは中身が取り出せないため。
 */
export async function extractOne(
  archivePath: string,
  destination: string,
  options: ExtractOneOptions
): Promise<void> {
  const info = await listArchive(
    archivePath,
    options.password === undefined ? {} : { password: options.password }
  )

  // 一覧で見せた名前と 7-Zip が書き出す名前が食い違う書庫は、展開後に付け替える
  const renames = info.entries
    .filter((entry) => entry.sourcePath !== entry.path)
    .map((entry) => ({ from: entry.sourcePath, to: entry.path }))

  const outputs = info.entries.filter((entry) => !entry.isDirectory).map((entry) => entry.path)
  let overwrite = options.overwrite

  // 断りなく上書きすると、取り返しのつかない形で既存のファイルが消える
  if (options.onConflict !== undefined) {
    const conflicts = await findConflicts(destination, outputs)
    if (conflicts.length > 0) {
      const answer = await options.onConflict(conflicts)
      if (answer === null) throw new ExtractCancelled()
      overwrite = answer
    }
  }

  const inner = tarInsideName(info.type, info.entries)
  const share = inner === null ? 100 : OUTER_SHARE
  const outerProgress = scaleProgress(options.onProgress, 0, share)

  await extractArchive(archivePath, {
    destination,
    // 進捗の分母を得るために一度だけ数える
    total: outputs.length,
    ...(renames.length === 0 ? {} : { renames }),
    ...(options.exclude === undefined ? {} : { exclude: options.exclude }),
    ...(overwrite === undefined ? {} : { overwrite }),
    ...(options.password === undefined ? {} : { password: options.password }),
    ...(options.signal === undefined ? {} : { signal: options.signal }),
    ...(outerProgress === undefined ? {} : { onProgress: outerProgress })
  })

  if (inner === null) return

  const innerProgress = scaleProgress(options.onProgress, share, 100)
  await unwrapTar(destination, inner, {
    ...(options.exclude === undefined ? {} : { exclude: options.exclude }),
    ...(overwrite === undefined ? {} : { overwrite }),
    ...(options.signal === undefined ? {} : { signal: options.signal }),
    ...(innerProgress === undefined ? {} : { onProgress: innerProgress })
  })
}
