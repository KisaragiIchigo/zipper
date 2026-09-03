import { useCallback, useEffect, useState } from 'react'
import type { UpdateStatus } from '@shared/types'

export interface UpdaterController {
  status: UpdateStatus
  /** 動いているアプリ自身の版 */
  version: string
  /** 知らせを閉じたかどうか。設定画面からは閉じていても操作できる */
  dismissed: boolean
  check: () => void
  download: () => void
  install: () => void
  dismiss: () => void
}

/**
 * 公開されている最新版との差を見張る。
 * 取得と適用は利用者が決めるまで行わない。
 */
export function useUpdater(): UpdaterController {
  const [status, setStatus] = useState<UpdateStatus>({ phase: 'idle' })
  const [version, setVersion] = useState('')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    void window.zipper.update.currentVersion().then(setVersion)

    return window.zipper.update.onStatus((next) => {
      setStatus(next)
      // 新しい知らせが来たら、閉じた状態は解除する
      if (next.phase === 'available' || next.phase === 'ready') setDismissed(false)
    })
  }, [])

  const check = useCallback(() => {
    setDismissed(false)
    void window.zipper.update.check().then(setStatus)
  }, [])

  return {
    status,
    version,
    dismissed,
    check,
    download: () => window.zipper.update.download(),
    install: () => window.zipper.update.install(),
    dismiss: () => setDismissed(true)
  }
}
