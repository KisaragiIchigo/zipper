import { useCallback, useEffect, useState } from 'react'
import type { ArchiveEntry, TaskProgress } from '@shared/types'
import type { FailureKind } from '@/lib/taskView'
import { EMPTY_PROGRESS } from '@/lib/taskTiming'

export type ModifyState =
  | { status: 'idle' }
  /** 取り除く前の確認待ち */
  | { status: 'confirming'; targets: ArchiveEntry[] }
  | { status: 'running'; progress: TaskProgress; startedAt: number; kind: 'add' | 'remove' }
  | { status: 'done'; kind: 'add' | 'remove' }
  | { status: 'failed'; kind: FailureKind }

export interface ModifyController {
  state: ModifyState
  /** ファイルを選ばせて書庫へ足す */
  addFiles: () => void
  requestRemove: (targets: readonly ArchiveEntry[]) => void
  confirmRemove: () => void
  cancelConfirm: () => void
  cancel: () => void
  dismiss: () => void
}

interface ModifyOptions {
  archivePath: string | null
  password: string | undefined
  /** 書庫の中身が変わったので読み直す */
  onChanged: () => void
}

/** 既存の書庫にファイルを足す、あるいは取り除く */
export function useModifyArchive({
  archivePath,
  password,
  onChanged
}: ModifyOptions): ModifyController {
  const [state, setState] = useState<ModifyState>({ status: 'idle' })

  useEffect(
    () =>
      window.zipper.archive.onTaskProgress((progress) => {
        setState((current) => (current.status === 'running' ? { ...current, progress } : current))
      }),
    []
  )

  const apply = useCallback(
    async (kind: 'add' | 'remove', targets: string[]) => {
      if (archivePath === null || targets.length === 0) return

      setState({ status: 'running', progress: EMPTY_PROGRESS, startedAt: Date.now(), kind })
      const request = {
        path: archivePath,
        targets,
        ...(password === undefined ? {} : { password })
      }
      const result =
        kind === 'add'
          ? await window.zipper.archive.add(request)
          : await window.zipper.archive.remove(request)

      if (result.ok) {
        setState({ status: 'done', kind })
        onChanged()
        return
      }
      setState({ status: 'failed', kind: result.kind })
    },
    [archivePath, onChanged, password]
  )

  const addFiles = useCallback(() => {
    void window.zipper.dialog.pickSources().then((paths) => {
      if (paths.length > 0) void apply('add', paths)
    })
  }, [apply])

  const requestRemove = useCallback((targets: readonly ArchiveEntry[]) => {
    if (targets.length === 0) return
    setState({ status: 'confirming', targets: [...targets] })
  }, [])

  const confirmRemove = useCallback(() => {
    setState((current) => {
      if (current.status !== 'confirming') return current
      void apply(
        'remove',
        current.targets.map((entry) => entry.sourcePath)
      )
      return current
    })
  }, [apply])

  return {
    state,
    addFiles,
    requestRemove,
    confirmRemove,
    cancelConfirm: () => setState({ status: 'idle' }),
    cancel: () => window.zipper.archive.cancelTask(),
    dismiss: () => setState({ status: 'idle' })
  }
}
