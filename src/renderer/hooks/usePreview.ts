import { useCallback, useState } from 'react'
import type { ArchiveEntry, ArchiveInfo, PreviewContent } from '@shared/types'
import { extractFailureMessage } from '@/lib/taskView'

export type PreviewState =
  | { status: 'closed' }
  | { status: 'loading'; entry: ArchiveEntry }
  | { status: 'ready'; entry: ArchiveEntry; content: PreviewContent }
  | { status: 'failed'; entry: ArchiveEntry; message: string }

export interface PreviewController {
  state: PreviewState
  open: (entry: ArchiveEntry) => void
  close: () => void
}

/** 書庫の中身を、外部のアプリを起こさずにその場で確かめる */
export function usePreview(
  info: ArchiveInfo | null,
  password: string | undefined,
  onLocked: (retry: boolean, replay: (password: string) => void) => void
): PreviewController {
  const [state, setState] = useState<PreviewState>({ status: 'closed' })

  const open = useCallback(
    (entry: ArchiveEntry) => {
      if (info === null || entry.isDirectory) return
      setState({ status: 'loading', entry })

      // 鍵を入れ直してもらったときは、同じ 1 件をそのまま読み直す
      const attempt = (key: string | undefined): void => {
        void window.zipper.archive
          .preview({
            path: info.path,
            entry: entry.sourcePath,
            displayPath: entry.path,
            size: entry.size,
            ...(key === undefined ? {} : { password: key })
          })
          .then((result) => {
            if (result.ok) {
              setState({ status: 'ready', entry, content: result.content })
              return
            }
            if (result.kind === 'password-required' || result.kind === 'wrong-password') {
              // 鍵を尋ねている間は、読めなかった旨を重ねて出さない
              setState({ status: 'closed' })
              onLocked(result.kind === 'wrong-password', (next) => {
                setState({ status: 'loading', entry })
                attempt(next)
              })
              return
            }
            setState({ status: 'failed', entry, message: extractFailureMessage(result.kind) })
          })
      }

      attempt(password)
    },
    [info, onLocked, password]
  )

  return { state, open, close: () => setState({ status: 'closed' }) }
}
