import type { ArchiveEntry, ArchiveInfo } from '@shared/types'
import { buildDirectoryView } from '@/lib/buildDirectoryView'
import { filterEntries } from '@/lib/filterEntries'

/**
 * 一覧に出す行を決める。
 *
 * 絞り込み中はフォルダの階層をたどる意味がないため、書庫全体を平らに並べる。
 * 絞り込みが無いときだけ、いま見ているフォルダの直下を見せる。
 */
export function resolveVisibleEntries(
  info: ArchiveInfo | null,
  query: string,
  currentPath: string
): ArchiveEntry[] {
  if (info === null) return []

  const searching = query.trim() !== ''
  return searching
    ? [...filterEntries(info.entries, query)]
    : buildDirectoryView(info.entries, currentPath)
}
