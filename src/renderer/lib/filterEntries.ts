import type { ArchiveEntry } from '@shared/types'

/**
 * ファイル名とパスの部分一致で絞り込む。
 * 数万件の書庫では目当ての 1 件までスクロールするのが現実的でないため、
 * 一覧の入口としてここを通す。大文字小文字は区別しない。
 */
export function filterEntries(
  entries: readonly ArchiveEntry[],
  query: string
): readonly ArchiveEntry[] {
  const needle = query.trim().toLowerCase()
  if (needle === '') return entries
  return entries.filter((entry) => entry.path.toLowerCase().includes(needle))
}
