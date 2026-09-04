import { EMPTY_PROGRESS } from '@/lib/taskTiming'
import { useCallback, useEffect, useState } from 'react'
import type { ArchiveFailureKind, OverwriteMode, TaskProgress } from '@shared/types'
import { directoryOf } from '@/lib/pathUtils'

interface PendingExtract {
  path: string
  destination: string
  entries?: string[]
  renames?: { from: string; to: string }[]
  /** 展開後に生まれる件数。進捗の分母になる */
  totalFiles: number
  /** 暗号化された項目を含むか。展開前に鍵を確かめるかの判断に使う */
  hasEncryptedEntry?: boolean
  password?: string
}

export type ExtractState =
  | { status: 'idle' }
  | { status: 'conflict'; conflicts: string[]; pending: PendingExtract }
  /** 鍵が要る、または鍵が違うと分かって止まっている状態 */
  | { status: 'locked'; pending: PendingExtract; overwrite: OverwriteMode; retry: boolean }
  | { status: 'running'; progress: TaskProgress; startedAt: number }
  | { status: 'done'; destination: string; summary?: string }
  | { status: 'failed'; kind: ArchiveFailureKind | 'cancelled' }

export interface ExtractRequestInput {
  path: string
  /** 7-Zip へ渡す名前。未指定なら書庫全体 */
  entries?: string[]
  renames?: { from: string; to: string }[]
  /** 展開後に生まれるパス。衝突の確認に使う */
  outputPaths: string[]
  /** 展開先。未指定ならダイアログで選ばせる */
  destination?: string
  /** 暗号化された項目を含むか */
  hasEncryptedEntry?: boolean
  password?: string
}

export interface BatchExtractInput {
  archives: readonly string[]
  /** ask は宛先を選ばせる */
  mode: 'here' | 'folder' | 'ask'
  password?: string
}

export interface ExtractController {
  state: ExtractState
  /** 展開先をダイアログで選ばせ、衝突があれば確認してから展開する */
  start: (input: ExtractRequestInput) => void
  /** 複数の書庫を、開かずに続けて取り出す */
  startBatch: (input: BatchExtractInput) => void
  /** 衝突の確認に答える。null は取り消し */
  resolveConflict: (mode: OverwriteMode | null) => void
  /** 鍵を受け取って、止まっていた展開をやり直す */
  submitPassword: (password: string) => void
  /** 鍵の入力をやめる */
  dismissPassword: () => void
  cancel: () => void
  dismiss: () => void
  reveal: (destination: string) => void
}

export function useExtract(): ExtractController {
  const [state, setState] = useState<ExtractState>({ status: 'idle' })

  useEffect(
    () =>
      window.zipper.archive.onTaskProgress((progress) => {
        setState((current) => (current.status === 'running' ? { ...current, progress } : current))
      }),
    []
  )

  const run = useCallback(async (pending: PendingExtract, overwrite: OverwriteMode) => {
    setState({ status: 'running', progress: EMPTY_PROGRESS, startedAt: Date.now() })

    const result = await window.zipper.archive.extract({
      path: pending.path,
      destination: pending.destination,
      overwrite,
      totalFiles: pending.totalFiles,
      ...(pending.entries === undefined ? {} : { entries: pending.entries }),
      ...(pending.renames === undefined ? {} : { renames: pending.renames }),
      ...(pending.hasEncryptedEntry === undefined
        ? {}
        : { hasEncryptedEntry: pending.hasEncryptedEntry }),
      ...(pending.password === undefined ? {} : { password: pending.password })
    })

    if (result.ok) {
      setState({ status: 'done', destination: result.destination })
      return
    }

    // 鍵の問題は失敗として畳まず、入れ直してもらう。宛先には何も書かれていない
    if (result.kind === 'password-required' || result.kind === 'wrong-password') {
      setState({ status: 'locked', pending, overwrite, retry: result.kind === 'wrong-password' })
      return
    }
    setState({ status: 'failed', kind: result.kind })
  }, [])

  const start = useCallback(
    (input: ExtractRequestInput) => {
      void (async () => {
        // 書庫と同じ場所から開く。別の場所へ出したいときだけ選び直してもらう
        const destination =
          input.destination ?? (await window.zipper.dialog.pickDirectory(directoryOf(input.path)))
        if (destination === null) return

        const pending: PendingExtract = {
          path: input.path,
          destination,
          totalFiles: input.outputPaths.length,
          ...(input.entries === undefined ? {} : { entries: input.entries }),
          ...(input.renames === undefined ? {} : { renames: input.renames }),
          ...(input.hasEncryptedEntry === undefined
            ? {}
            : { hasEncryptedEntry: input.hasEncryptedEntry }),
          ...(input.password === undefined ? {} : { password: input.password })
        }

        const conflicts = await window.zipper.archive.checkConflicts({
          destination,
          entries: input.outputPaths
        })

        if (conflicts.length > 0) {
          setState({ status: 'conflict', conflicts, pending })
          return
        }
        await run(pending, 'overwrite')
      })()
    },
    [run]
  )

  const resolveConflict = useCallback(
    (mode: OverwriteMode | null) => {
      setState((current) => {
        if (current.status !== 'conflict') return current
        if (mode === null) return { status: 'idle' }
        void run(current.pending, mode)
        return current
      })
    },
    [run]
  )

  const startBatch = useCallback((input: BatchExtractInput) => {
    if (input.archives.length === 0) return

    void (async () => {
      let destination: string | undefined
      if (input.mode === 'ask') {
        // 1 つ目の書庫がある場所から開く。まとめて選ぶときは同じ場所にあることが多い
        const first = input.archives[0]
        const picked = await window.zipper.dialog.pickDirectory(
          first === undefined ? undefined : directoryOf(first)
        )
        if (picked === null) return
        destination = picked
      }

      setState({ status: 'running', progress: EMPTY_PROGRESS, startedAt: Date.now() })
      const result = await window.zipper.archive.extractBatch({
        archives: [...input.archives],
        mode: input.mode === 'ask' ? 'fixed' : input.mode,
        ...(destination === undefined ? {} : { destination }),
        ...(input.password === undefined ? {} : { password: input.password })
      })

      if (!result.ok) {
        setState({ status: 'failed', kind: result.kind })
        return
      }

      // 一部だけ失敗した場合も、どこまで進んだかを伝える
      const summary =
        result.failed > 0
          ? result.succeeded + ' 件を取り出しました（' + result.failed + ' 件は失敗）'
          : undefined
      setState({
        status: 'done',
        destination: result.destination,
        ...(summary === undefined ? {} : { summary })
      })
    })()
  }, [])

  const submitPassword = useCallback(
    (password: string) => {
      setState((current) => {
        if (current.status !== 'locked') return current
        void run({ ...current.pending, password }, current.overwrite)
        return current
      })
    },
    [run]
  )

  const dismissPassword = useCallback(() => setState({ status: 'idle' }), [])
  const cancel = useCallback(() => window.zipper.archive.cancelTask(), [])
  const dismiss = useCallback(() => setState({ status: 'idle' }), [])
  const reveal = useCallback((destination: string) => window.zipper.shell.reveal(destination), [])

  return {
    state,
    start,
    startBatch,
    resolveConflict,
    submitPassword,
    dismissPassword,
    cancel,
    dismiss,
    reveal
  }
}
