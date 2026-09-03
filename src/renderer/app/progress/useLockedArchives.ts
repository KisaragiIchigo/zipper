import { useCallback, useState } from 'react'
import type { ArchiveLogGroup } from '@/components/TaskProgressDialog/useArchiveLog'

export interface LockedArchive {
  key: string
  path: string
  /** 直前に入れたパスワードが違っていた場合 */
  retry: boolean
}

export interface LockedArchivesController {
  target: LockedArchive | null
  /** この書庫は諦める。以降は聞き直さない */
  dismiss: () => void
}

/** パスワードが要る書庫か */
function isLocked(group: ArchiveLogGroup): boolean {
  return group.kind === 'password-required' || group.kind === 'wrong-password'
}

/**
 * パスワードが必要で取り出せなかった書庫を 1 つずつ拾う。
 *
 * 右クリックから解凍したときは書庫を開かないため、パスワードを尋ねる機会がない。
 * 処理が終わってから、鍵の掛かっていた書庫について順に尋ね直す。
 */
export function useLockedArchives(
  groups: readonly ArchiveLogGroup[],
  busy: boolean
): LockedArchivesController {
  const [dismissed, setDismissed] = useState<string[]>([])

  const found = busy
    ? undefined
    : groups.find(
        (group) => isLocked(group) && group.path !== null && !dismissed.includes(group.key)
      )

  const target: LockedArchive | null =
    found === undefined || found.path === null
      ? null
      : { key: found.key, path: found.path, retry: found.kind === 'wrong-password' }

  const dismiss = useCallback(() => {
    if (found === undefined) return
    setDismissed((current) => [...current, found.key])
  }, [found])

  return { target, dismiss }
}
