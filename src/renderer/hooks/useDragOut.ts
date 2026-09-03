import { useCallback } from 'react'
import type { ArchiveEntry, ArchiveInfo } from '@shared/types'

/**
 * 一覧の行をエクスプローラーへ引きずり出せるようにする。
 *
 * 掴んだ行が選択に入っていればその選択をまとめて、
 * 入っていなければ掴んだ行だけを渡す。エクスプローラーと同じ振る舞い。
 */
export function useDragOut(
  info: ArchiveInfo | null,
  password: string | undefined,
  selected: ReadonlySet<string>
): (entry: ArchiveEntry) => void {
  return useCallback(
    (entry: ArchiveEntry) => {
      if (info === null) return

      const wanted = selected.has(entry.path) ? selected : new Set([entry.path])
      const targets = info.entries
        .filter((candidate) => wanted.has(candidate.path))
        .map((candidate) => ({ entry: candidate.sourcePath, displayPath: candidate.path }))

      if (targets.length === 0) return

      window.zipper.archive.startDrag({
        path: info.path,
        targets,
        ...(password === undefined ? {} : { password })
      })
    },
    [info, password, selected]
  )
}
