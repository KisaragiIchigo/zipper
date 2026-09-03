import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import type { ArchiveEntry, OverwriteMode, TaskProgress } from '@shared/types'
import { extractArchive } from '../extractArchive'

export interface UnwrapTarOptions {
  exclude?: readonly string[]
  overwrite?: OverwriteMode
  onProgress?: (progress: TaskProgress) => void
  signal?: AbortSignal
}

/**
 * 1 つのファイルしか包めない形式。これらだけが TAR を挟んでいる可能性を持つ。
 * 7-Zip が返す種類の名前に合わせる。
 */
const SINGLE_FILE_TYPES = new Set(['gzip', 'bzip2', 'xz', 'z', 'lzma', 'zstd'])

/**
 * 中身が TAR ひとつだけかを調べ、その名前を返す。
 *
 * GZIP や XZ は 1 つのファイルしか包めないため、複数のファイルは
 * TAR にまとめてから詰められている。取り出したときに TAR が 1 つだけ
 * 残っていては、利用者から見て解凍が終わっていない。
 *
 * 判定には書庫の種類も見る。ZIP に TAR を 1 つだけ入れた書庫は、
 * その TAR を残したくて包んだものなので、開いてはいけない。
 */
export function tarInsideName(type: string, entries: readonly ArchiveEntry[]): string | null {
  if (!SINGLE_FILE_TYPES.has(type.toLowerCase())) return null

  const files = entries.filter((entry) => !entry.isDirectory)
  if (files.length !== 1) return null

  const only = files[0]
  if (only === undefined) return null
  return only.path.toLowerCase().endsWith('.tar') ? only.path : null
}

/** 取り出した TAR をその場で開き直し、元の TAR を片付ける */
export async function unwrapTar(
  destination: string,
  tarName: string,
  options: UnwrapTarOptions
): Promise<void> {
  const tarPath = join(destination, tarName)

  await extractArchive(tarPath, {
    destination,
    ...(options.exclude === undefined ? {} : { exclude: options.exclude }),
    ...(options.overwrite === undefined ? {} : { overwrite: options.overwrite }),
    ...(options.onProgress === undefined ? {} : { onProgress: options.onProgress }),
    ...(options.signal === undefined ? {} : { signal: options.signal })
  })

  await rm(tarPath, { force: true })
}
