import type { CompressController, CompressState } from '@/hooks/useCompress'
import type { ExtractController, ExtractState } from '@/hooks/useExtract'
import type { ModifyController, ModifyState } from '@/hooks/useModifyArchive'
import type { VerifyController, VerifyState } from '@/hooks/useVerify'
import {
  compressFailureMessage,
  extractFailureMessage,
  modifyFailureMessage,
  verifyFailureMessage,
  type TaskView
} from '@/lib/taskView'

export interface TaskSources {
  extract: ExtractState
  compress: CompressState
  verify: VerifyState
  modify: ModifyState
  /** 1 件を開こうとして失敗したときの文言 */
  openError: string | null
}

function fromExtract(state: ExtractState): TaskView | null {
  switch (state.status) {
    case 'running':
      return {
        kind: 'running',
        label: '展開しています',
        progress: state.progress,
        startedAt: state.startedAt
      }
    case 'done':
      return {
        kind: 'done',
        destination: state.destination,
        label: state.summary ?? state.destination + ' に展開しました'
      }
    case 'failed':
      return { kind: 'failed', message: extractFailureMessage(state.kind) }
    default:
      return null
  }
}

function fromCompress(state: CompressState): TaskView | null {
  switch (state.status) {
    case 'running':
      return {
        kind: 'running',
        label: '圧縮しています',
        progress: state.progress,
        startedAt: state.startedAt
      }
    case 'done':
      return {
        kind: 'done',
        destination: state.destination,
        label: state.summary ?? state.destination + ' を作成しました'
      }
    case 'failed':
      return { kind: 'failed', message: compressFailureMessage(state.kind) }
    default:
      return null
  }
}

function fromVerify(state: VerifyState): TaskView | null {
  switch (state.status) {
    case 'running':
      return {
        kind: 'running',
        label: '中身を確認しています',
        progress: state.progress,
        startedAt: state.startedAt
      }
    case 'done':
      return state.failures.length === 0
        ? { kind: 'done', label: '中身に問題は見つかりませんでした' }
        : {
            kind: 'failed',
            message: state.failures.length + ' 件に問題があります: ' + state.failures.join(' / ')
          }
    case 'failed':
      return { kind: 'failed', message: verifyFailureMessage(state.kind) }
    default:
      return null
  }
}

function fromModify(state: ModifyState): TaskView | null {
  const label = state.status === 'running' || state.status === 'done' ? state.kind : null

  switch (state.status) {
    case 'running':
      return {
        kind: 'running',
        label: label === 'add' ? '書庫に追加しています' : '書庫から取り除いています',
        progress: state.progress,
        startedAt: state.startedAt
      }
    case 'done':
      return {
        kind: 'done',
        label: label === 'add' ? '書庫に追加しました' : '書庫から取り除きました'
      }
    case 'failed':
      return { kind: 'failed', message: modifyFailureMessage(state.kind) }
    default:
      return null
  }
}

/**
 * 進行中の作業を、進捗表示の共通形へまとめる。
 * これらは同時に走らないため、動いているものを 1 つだけ拾えばよい。
 */
export function buildTaskView(sources: TaskSources): TaskView {
  const found =
    fromExtract(sources.extract) ??
    fromCompress(sources.compress) ??
    fromVerify(sources.verify) ??
    fromModify(sources.modify)
  if (found !== null) return found

  return sources.openError === null
    ? { kind: 'hidden' }
    : { kind: 'failed', message: sources.openError }
}

export interface TaskOwner {
  cancel: () => void
  dismiss: () => void
  /** 結果に開ける場所があるものだけが持つ */
  reveal?: (destination: string) => void
}

/**
 * 進捗表示の中止と後片付けを、どの作業へ向けるかを決める。
 * 同時には走らないため、動いているものを順に探せばよい。
 */
export function resolveTaskOwner(
  extract: ExtractController,
  verify: VerifyController,
  modify: ModifyController,
  compress: CompressController
): TaskOwner {
  if (extract.state.status !== 'idle' && extract.state.status !== 'conflict') return extract
  if (verify.state.status !== 'idle') return verify

  const modifying =
    modify.state.status === 'running' ||
    modify.state.status === 'done' ||
    modify.state.status === 'failed'
  return modifying ? modify : compress
}
