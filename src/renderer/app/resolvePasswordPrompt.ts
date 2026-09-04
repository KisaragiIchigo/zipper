import type { ArchiveController } from '@/hooks/useArchive'
import type { ExtractController } from '@/hooks/useExtract'
import type { LockedActionController } from './useLockedAction'

export interface PasswordPrompt {
  /** どの書庫について尋ねているか */
  path: string
  /** 直前に入れた鍵が違っていた場合 */
  retry: boolean
  onSubmit: (password: string) => void
  onCancel: () => void
}

/**
 * 鍵を尋ねる場面をひとつにまとめる。
 *
 * 書庫を開くとき、取り出すとき、中の 1 件を開くとき——鍵が要ると分かる機会は複数ある。
 * どれも同時には起きないため、問いは 1 つに畳み、答えをどの操作へ返すかだけを決める。
 */
export function resolvePasswordPrompt(
  archive: ArchiveController,
  extract: ExtractController,
  locked: LockedActionController
): PasswordPrompt | null {
  const { state } = archive

  // 一覧そのものが読めていない状態。鍵が入るまで中身は出せない
  if (state.status === 'password') {
    return {
      path: state.path,
      retry: state.retry,
      onSubmit: archive.openWithPassword,
      onCancel: archive.close
    }
  }

  // 取り出す直前で止まっている。宛先にはまだ何も書かれていない
  if (extract.state.status === 'locked') {
    return {
      path: extract.state.pending.path,
      retry: extract.state.retry,
      onSubmit: extract.submitPassword,
      onCancel: extract.dismissPassword
    }
  }

  // 中の 1 件を開こうとして、鍵が要ると分かった
  if (locked.prompt !== null) {
    return {
      path: archive.path ?? '',
      retry: locked.prompt.retry,
      onSubmit: locked.submit,
      onCancel: locked.dismiss
    }
  }

  return null
}
