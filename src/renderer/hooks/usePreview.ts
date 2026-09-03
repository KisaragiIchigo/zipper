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
  password: string | undefined
): PreviewController {
  const [state, setState] = useState<PreviewState>({ status: 'closed' })

  const open = useCallback(
    (entry: ArchiveEntry) => {
      if (info === null || entry.isDirectory) return
      setState({ status: 'loading', entry })

      void window.zipper.archive
        .preview({
          path: info.path,
          entry: entry.sourcePath,
          displayPath: entry.path,
          size: entry.size,
          ...(password === undefined ? {} : { password })
        })
        .then((result) => {
          setState(
            result.ok
              ? { status: 'ready', entry, content: result.content }
              : { status: 'failed', entry, message: extractFailureMessage(result.kind) }
          )
        })
    },
    [info, password]
  )

  return { state, open, close: () => setState({ status: 'closed' }) }
}
