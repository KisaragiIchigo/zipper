import { useCallback, useState } from 'react'
import type { ArchiveEntry, ArchiveInfo } from '@shared/types'
import { extractFailureMessage } from '@/lib/taskView'

export interface EntryOpener {
  /** 選んだ 1 件を取り出して、関連付けられたアプリへ渡す */
  open: (entry: ArchiveEntry) => void
  error: string | null
  dismiss: () => void
}

/**
 * 書庫の中身をその場で開く。
 * 書庫を丸ごと展開せずに 1 件だけ確かめたい、という一番多い用途を受け持つ。
 */
export function useEntryOpener(
  info: ArchiveInfo | null,
  password: string | undefined,
  onLocked: (retry: boolean, replay: (password: string) => void) => void
): EntryOpener {
  const [error, setError] = useState<string | null>(null)

  const open = useCallback(
    (entry: ArchiveEntry) => {
      if (info === null || entry.isDirectory) return

      // 鍵を入れ直してもらったときは、同じ 1 件をそのまま開き直す
      const attempt = (key: string | undefined): void => {
        void window.zipper.archive
          .openEntry({
            path: info.path,
            entry: entry.sourcePath,
            displayPath: entry.path,
            ...(key === undefined ? {} : { password: key })
          })
          .then((result) => {
            if (result.ok) {
              setError(null)
              return
            }
            if (result.kind === 'password-required' || result.kind === 'wrong-password') {
              onLocked(result.kind === 'wrong-password', attempt)
              return
            }
            setError(extractFailureMessage(result.kind))
          })
      }

      attempt(password)
    },
    [info, onLocked, password]
  )

  return { open, error, dismiss: () => setError(null) }
}
