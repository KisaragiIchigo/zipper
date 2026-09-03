import type { ArchiveEntry } from '@shared/types'

/**
 * いま見ているフォルダの直下だけを取り出す。
 *
 * ZIP はフォルダのエントリを持たないことがあるため、実在するものだけに頼らず、
 * ファイルのパスからフォルダを組み立てる。合成したフォルダの大きさは配下の合計とする。
 */
export function buildDirectoryView(
  all: readonly ArchiveEntry[],
  currentPath: string
): ArchiveEntry[] {
  const prefix = currentPath === '' ? '' : currentPath + '/'
  const depth = currentPath === '' ? 0 : currentPath.split('/').length

  const files: ArchiveEntry[] = []
  const folders = new Map<string, ArchiveEntry>()

  for (const entry of all) {
    if (prefix !== '' && !entry.path.startsWith(prefix)) continue

    const relative = entry.path.slice(prefix.length)
    if (relative === '') continue

    const separator = relative.indexOf('/')
    if (separator < 0) {
      if (entry.isDirectory) folders.set(relative, entry)
      else files.push(entry)
      continue
    }

    // 一段下のフォルダ。無ければこの場で作る
    const name = relative.slice(0, separator)
    const existing = folders.get(name)

    if (existing === undefined) {
      folders.set(name, {
        path: prefix + name,
        // 7-Zip 側の名前も同じ深さで切り出す。補正が入った書庫でも展開の指定が通る
        sourcePath: entry.sourcePath.split('/').slice(0, depth + 1).join('/'),
        isDirectory: true,
        size: entry.size,
        packedSize: entry.packedSize,
        modified: entry.modified,
        crc: null,
        method: null,
        encrypted: entry.encrypted
      })
      continue
    }

    folders.set(name, {
      ...existing,
      size: existing.size + entry.size,
      packedSize: existing.packedSize + entry.packedSize,
      encrypted: existing.encrypted || entry.encrypted,
      modified:
        existing.modified === null || (entry.modified ?? '') > existing.modified
          ? entry.modified
          : existing.modified
    })
  }

  return [...folders.values(), ...files]
}

/** パンくずに並べる各段。path はその段までのフルパス */
export function breadcrumbSegments(currentPath: string): { name: string; path: string }[] {
  if (currentPath === '') return []

  const segments = currentPath.split('/')
  return segments.map((name, index) => ({
    name,
    path: segments.slice(0, index + 1).join('/')
  }))
}

/** 1 つ上のフォルダ。最上位なら null */
export function parentDirectory(currentPath: string): string | null {
  if (currentPath === '') return null
  const index = currentPath.lastIndexOf('/')
  return index < 0 ? '' : currentPath.slice(0, index)
}
