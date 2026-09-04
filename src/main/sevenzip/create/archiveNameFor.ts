import { stat } from 'node:fs/promises'
import { basename, extname } from 'node:path'
import { FORMAT_TRAITS } from '@shared/archiveFormats'
import type { ArchiveFormat } from '@shared/types'

export interface ArchiveName {
  /** 拡張子を除いた部分 */
  stem: string
  /** 先頭のドットを含む拡張子。TAR を挟む形式では .tar.gz のように重なる */
  extension: string
}

/** 末尾の拡張子だけを落とす。先頭のドットは拡張子とみなさない */
function stripExtension(name: string): string {
  const extension = extname(name)
  return extension === '' ? name : name.slice(0, -extension.length)
}

async function isDirectory(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory()
  } catch {
    // 読めない対象はここでは判定できない。作成を試みた段階で改めて失敗する
    return false
  }
}

/**
 * 対象 1 つ分の書庫名を決める。
 *
 * 実体を見て決められるため、名前の見た目から見当をつける必要がない。
 * フォルダ名はドットを含んでいても名前の一部なので、拡張子として落とさない。
 * まとめられない形式へフォルダを渡すと TAR を挟むため、そのぶん拡張子が重なる。
 */
export async function archiveNameFor(
  source: string,
  format: ArchiveFormat
): Promise<ArchiveName> {
  const traits = FORMAT_TRAITS[format]
  const name = basename(source)
  const base = name === '' ? 'archive' : name
  const directory = await isDirectory(source)

  if (!traits.multiFile) {
    // 1 つのファイルをそのまま詰める形式では、元の名前を残さないと何か分からなくなる
    return {
      stem: base,
      extension: directory ? (traits.tarExtension ?? traits.extension) : traits.extension
    }
  }

  return {
    stem: directory ? base : stripExtension(base),
    extension: traits.extension
  }
}
