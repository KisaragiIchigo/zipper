import type { ArchiveFailureKind, TaskProgress } from '@shared/types'

/** 進行中の作業を TaskBar へ渡すための、展開と圧縮で共通の見せ方 */
export type TaskView =
  | { kind: 'hidden' }
  | { kind: 'running'; label: string; progress: TaskProgress; startedAt: number }
  | { kind: 'done'; label: string; destination?: string }
  | { kind: 'failed'; message: string }

export type FailureKind = ArchiveFailureKind | 'cancelled'

const EXTRACT_MESSAGES: Record<FailureKind, string> = {
  cancelled: '展開を中止しました。',
  'password-required': 'パスワードが必要です。書庫を開き直してから展開してください。',
  'wrong-password': 'パスワードが正しくありません。',
  'not-archive': '書庫として読み取れませんでした。',
  'not-found': 'ファイルが見つかりませんでした。',
  corrupted: '書庫が壊れています。中身を最後まで読み取れませんでした。',
  busy: 'この書庫は別の窓で書き換えている最中です。終わってからやり直してください。',
  unknown: '展開に失敗しました。'
}

const VERIFY_MESSAGES: Record<FailureKind, string> = {
  cancelled: '検証を中止しました。',
  'password-required': 'パスワードが必要です。書庫を開き直してから検証してください。',
  'wrong-password': 'パスワードが正しくありません。',
  'not-archive': '書庫として読み取れませんでした。',
  'not-found': 'ファイルが見つかりませんでした。',
  corrupted: '書庫が壊れています。中身を最後まで読み取れませんでした。',
  busy: 'この書庫は別の窓で書き換えている最中です。終わってからやり直してください。',
  unknown: '検証できませんでした。'
}

const COMPRESS_MESSAGES: Record<FailureKind, string> = {
  cancelled: '圧縮を中止しました。',
  'password-required': 'パスワードの設定に失敗しました。',
  'wrong-password': 'パスワードの設定に失敗しました。',
  'not-archive': '書庫を作成できませんでした。',
  'not-found': '対象のファイルが見つかりませんでした。',
  corrupted: '書庫の書き出しに失敗しました。',
  busy: 'この書き出し先は別の窓が使っている最中です。終わってからやり直してください。',
  unknown: '圧縮に失敗しました。保存先の空き容量と書き込み権限をご確認ください。'
}

export function extractFailureMessage(kind: FailureKind): string {
  return EXTRACT_MESSAGES[kind]
}

export function compressFailureMessage(kind: FailureKind): string {
  return COMPRESS_MESSAGES[kind]
}

export function verifyFailureMessage(kind: FailureKind): string {
  return VERIFY_MESSAGES[kind]
}

const MODIFY_MESSAGES: Record<FailureKind, string> = {
  cancelled: '書庫の変更を中止しました。',
  'password-required': 'パスワードが必要です。書庫を開き直してからやり直してください。',
  'wrong-password': 'パスワードが正しくありません。',
  'not-archive': 'この形式の書庫は書き換えられません。',
  'not-found': '対象のファイルが見つかりませんでした。',
  corrupted: '書庫が壊れているため書き換えられません。',
  busy: 'この書庫は別の窓で書き換えている最中です。終わってからやり直してください。',
  unknown: '書庫を書き換えられませんでした。'
}

export function modifyFailureMessage(kind: FailureKind): string {
  return MODIFY_MESSAGES[kind]
}
