import type { WebContents } from 'electron'
import { IPC } from '@shared/ipc'
import type { ArchiveFailureKind, ArchiveOutcome, TaskProgress } from '@shared/types'
import { ArchiveFailure } from '../../../sevenzip/ArchiveFailure'

export type FailureKind = ArchiveFailureKind | 'cancelled'

export function failureKindOf(error: unknown, aborted: boolean): FailureKind {
  if (aborted) return 'cancelled'
  if (error instanceof ArchiveFailure) return error.kind
  return 'unknown'
}

export interface TaskRunner {
  /** 新しい作業を始める。前の作業が残っていれば打ち切る */
  begin: () => AbortController
  finish: (controller: AbortController) => void
  cancel: () => void
  reportProgress: (progress: TaskProgress) => void
  reportOutcome: (outcome: ArchiveOutcome) => void
}

/** 窓ごとの進行状況。窓が閉じたときに取り除く */
const runners = new Map<number, TaskRunner>()

function createTaskRunner(contents: WebContents): TaskRunner {
  let running: AbortController | null = null

  const send = (channel: string, payload: unknown): void => {
    if (!contents.isDestroyed()) contents.send(channel, payload)
  }

  return {
    begin: () => {
      running?.abort()
      const controller = new AbortController()
      running = controller
      return controller
    },
    finish: (controller) => {
      if (running === controller) running = null
    },
    cancel: () => {
      running?.abort()
    },
    reportProgress: (progress) => send(IPC.archiveTaskProgress, progress),
    reportOutcome: (outcome) => send(IPC.archiveTaskOutcome, outcome)
  }
}

/**
 * 要求してきた窓の進行管理を返す。
 *
 * 展開・圧縮・検証・書き換えは 1 つの窓の中では同時に走らせない。
 * 取り消しの対象を一意に決められるようにするため。
 * 窓が別なら互いに影響しないので、窓ごとに分けて持つ。
 */
export function runnerFor(contents: WebContents): TaskRunner {
  const existing = runners.get(contents.id)
  if (existing !== undefined) return existing

  const created = createTaskRunner(contents)
  runners.set(contents.id, created)
  contents.once('destroyed', () => {
    created.cancel()
    runners.delete(contents.id)
  })
  return created
}
