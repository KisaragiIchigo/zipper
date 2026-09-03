import type { ArchiveFailureKind, ArchiveInfo, OpenArchiveRequest } from '@shared/types'

export type ArchiveState =
  | { status: 'idle' }
  | { status: 'loading'; path: string }
  | { status: 'ready'; info: ArchiveInfo }
  | { status: 'failed'; path: string; kind: ArchiveFailureKind }
  | { status: 'password'; path: string; retry: boolean }

/**
 * 書庫を 1 つ読み込み、その結果の状態を返す。
 *
 * タブごとに独立して呼べるよう、React の状態を持たない形にしてある。
 * パスワードが要る書庫は失敗ではなく、入力を待つ状態として扱う。
 */
export async function loadArchiveState(request: OpenArchiveRequest): Promise<ArchiveState> {
  const result = await window.zipper.archive.open(request)

  if (result.ok) return { status: 'ready', info: result.info }

  if (result.kind === 'password-required' || result.kind === 'wrong-password') {
    return { status: 'password', path: request.path, retry: result.kind === 'wrong-password' }
  }
  return { status: 'failed', path: request.path, kind: result.kind }
}

/** どの段階にあっても、対象の書庫は一意に決まる */
export function pathOf(state: ArchiveState): string | null {
  switch (state.status) {
    case 'idle':
      return null
    case 'ready':
      return state.info.path
    default:
      return state.path
  }
}
