import type { ArchiveEntry } from '@shared/types'

export type SortColumn = 'path' | 'size' | 'packedSize' | 'kind' | 'modified'
export type SortDirection = 'asc' | 'desc'

export interface SortState {
  column: SortColumn
  direction: SortDirection
}

/** 表示上の「種類」。拡張子を大文字にしたもの */
export function entryKind(entry: ArchiveEntry): string {
  if (entry.isDirectory) return 'フォルダ'
  const name = entry.path.slice(entry.path.lastIndexOf('/') + 1)
  const dot = name.lastIndexOf('.')
  return dot <= 0 ? 'ファイル' : name.slice(dot + 1).toUpperCase()
}

function compare(a: ArchiveEntry, b: ArchiveEntry, column: SortColumn): number {
  switch (column) {
    case 'size':
      return a.size - b.size
    case 'packedSize':
      return a.packedSize - b.packedSize
    case 'modified':
      return (a.modified ?? '').localeCompare(b.modified ?? '')
    case 'kind':
      return entryKind(a).localeCompare(entryKind(b), 'ja')
    case 'path':
      return a.path.localeCompare(b.path, 'ja')
  }
}

/** フォルダを常に先に置き、その中で指定列の順に並べる */
export function sortEntries(entries: readonly ArchiveEntry[], sort: SortState): ArchiveEntry[] {
  const sign = sort.direction === 'asc' ? 1 : -1
  return [...entries].sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
    const result = compare(a, b, sort.column)
    return result === 0 ? a.path.localeCompare(b.path, 'ja') : result * sign
  })
}
