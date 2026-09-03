import type { ArchiveFailureKind } from '@shared/types'

/**
 * 7-Zip の出力から失敗の種類を判別する。
 *
 * 出力のうち OS 由来のメッセージは -sccUTF-8 を付けても ANSI のまま返り、
 * そのまま画面に出すと文字化けする。ここでは種類だけを判定し、
 * 利用者へ見せる文言は UI 側が持つ。
 */
export function classifyFailure(output: string, hasPassword: boolean): ArchiveFailureKind {
  if (output.includes('Enter password')) return 'password-required'
  if (output.includes('Wrong password')) return 'wrong-password'
  if (output.includes('Is not archive') || output.includes('Cannot open the file as')) {
    // パスワード指定済みでヘッダを開けない場合、原因はパスワード違いの可能性が高い
    return hasPassword ? 'wrong-password' : 'not-archive'
  }
  if (output.includes('System ERROR')) return 'not-found'
  // 書庫としては読めたが、中身が途中で終わっている場合はここに来る
  if (
    output.includes('Unexpected end of archive') ||
    output.includes('Headers Error') ||
    output.includes('Archives with Errors')
  ) {
    return 'corrupted'
  }
  if (hasPassword) return 'wrong-password'
  return 'unknown'
}
