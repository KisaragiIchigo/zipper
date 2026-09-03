import { FORMAT_TRAITS } from '@shared/archiveFormats'
import type { ArchiveFormat } from '@shared/types'
import { baseNameOf, stripExtension } from '@/lib/pathUtils'

/** 名前に拡張子が付いているか。フォルダかファイルかの目安に使う */
const HAS_EXTENSION = /\.[^.\/]+$/

/**
 * GZIP のように 1 つのファイルしか包めない形式で、TAR を挟むことになるか。
 *
 * 実際の判定は展開側がファイルの実体を見て行う。ここでは保存ダイアログに
 * 出す初期値を決めるだけなので、名前から見当をつければ足りる。
 */
function looksLikeTarTarget(sources: readonly string[], format: ArchiveFormat): boolean {
  if (FORMAT_TRAITS[format].multiFile) return false
  if (sources.length !== 1) return true
  return !HAS_EXTENSION.test(sources[0] ?? '')
}

/**
 * 保存ダイアログの初期ファイル名を決める。
 *
 * 1 つだけ選んだ場合はその名前から拡張子を差し替え、複数なら最初の名前をそのまま土台にする。
 * ただし GZIP などで 1 つのファイルをそのまま詰めるときは、元の名前を残して
 * 拡張子を足すだけにする（data.bin なら data.bin.gz）。
 */
export function defaultArchiveName(sources: readonly string[], format: ArchiveFormat): string {
  const traits = FORMAT_TRAITS[format]
  const viaTar = looksLikeTarTarget(sources, format)
  const extension = viaTar ? (traits.tarExtension ?? traits.extension) : traits.extension

  const first = sources[0]
  if (first === undefined) return 'archive' + extension

  const name = baseNameOf(first)
  // 単一ファイルをそのまま詰める形式では、元の名前を残さないと何のファイルか分からなくなる
  if (!traits.multiFile && !viaTar) return (name === '' ? 'archive' : name) + extension

  const stem = sources.length === 1 ? stripExtension(name) : name
  return (stem === '' ? 'archive' : stem) + extension
}
