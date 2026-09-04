import { useCallback, useState } from 'react'

/** 鍵を受け取ってから、もう一度実行する操作 */
type Replay = (password: string) => void

interface HeldAction {
  retry: boolean
  replay: Replay
}

export interface LockedActionController {
  /** 鍵の入力を求めている状態。求めていなければ null */
  prompt: { retry: boolean } | null
  /** 鍵が要ると分かって止まった操作を預ける */
  hold: (retry: boolean, replay: Replay) => void
  submit: (password: string) => void
  dismiss: () => void
}

/**
 * 鍵が要ると分かって止まった操作を預かり、入力を得てからやり直す。
 *
 * 中身だけを暗号化した書庫は一覧が鍵なしで読めるため、開いた時点では鍵を尋ねられない。
 * 取り出す・開く・中を見る、のどれかで初めて必要と分かるので、
 * そのときに尋ね、答えを得たら利用者が押した操作をそのまま続ける。
 */
export function useLockedAction(remember: (password: string) => void): LockedActionController {
  const [held, setHeld] = useState<HeldAction | null>(null)

  const hold = useCallback((retry: boolean, replay: Replay) => {
    setHeld({ retry, replay })
  }, [])

  const submit = useCallback(
    (password: string) => {
      if (held === null) return
      // 以降の操作でも同じ鍵を使えるよう、書庫側にも覚えさせる
      remember(password)
      setHeld(null)
      held.replay(password)
    },
    [held, remember]
  )

  const dismiss = useCallback(() => setHeld(null), [])

  return {
    prompt: held === null ? null : { retry: held.retry },
    hold,
    submit,
    dismiss
  }
}
