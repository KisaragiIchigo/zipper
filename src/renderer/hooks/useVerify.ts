import type { TaskProgress } from '@shared/types'
import { useCallback, useEffect, useState } from 'react'
import type { FailureKind } from '@/lib/taskView'
import { EMPTY_PROGRESS } from '@/lib/taskTiming'

export type VerifyState =
  | { status: 'idle' }
  | { status: 'running'; progress: TaskProgress; startedAt: number }
  | { status: 'done'; failures: string[] }
  | { status: 'failed'; kind: FailureKind }

export interface VerifyController {
  state: VerifyState
  start: () => void
  cancel: () => void
  dismiss: () => void
}

/** 書庫の中身を読み直して壊れていないかを確かめる */
export function useVerify(
  archivePath: string | null,
  password: string | undefined,
  totalFiles: number
): VerifyController {
  const [state, setState] = useState<VerifyState>({ status: 'idle' })

  useEffect(
    () =>
      window.zipper.archive.onTaskProgress((progress) => {
        setState((current) => (current.status === 'running' ? { ...current, progress } : current))
      }),
    []
  )

  const start = useCallback(() => {
    if (archivePath === null) return
    setState({ status: 'running', progress: EMPTY_PROGRESS, startedAt: Date.now() })

    void window.zipper.archive
      .test({ path: archivePath, totalFiles, ...(password === undefined ? {} : { password }) })
      .then((result) => {
        setState(
          result.ok
            ? { status: 'done', failures: result.failures }
            : { status: 'failed', kind: result.kind }
        )
      })
  }, [archivePath, password, totalFiles])

  return {
    state,
    start,
    cancel: () => window.zipper.archive.cancelTask(),
    dismiss: () => setState({ status: 'idle' })
  }
}
