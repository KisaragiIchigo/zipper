import { useCallback, useEffect, useState } from 'react'
import type { ArchiveOutcome, TaskProgress } from '@shared/types'
import { extractFailureMessage, type FailureKind } from '@/lib/taskView'

/** 1 つの書庫について残す行数の上限。長い処理でも記憶を圧迫させない */
const FILE_LIMIT = 2000

export interface ArchiveLogGroup {
  /** 書庫の名前。やり直したときに同じ行が更新されるよう、順番ではなく名前で引く */
  key: string
  name: string
  /** 書庫の場所。結果が届いて初めて分かる */
  path: string | null
  status: 'running' | 'done' | 'failed'
  /** 失敗したときの理由 */
  message: string | null
  /** 失敗の種類。パスワードのやり直しに使う */
  kind: FailureKind | null
  files: string[]
  expanded: boolean
}

export interface ArchiveLogController {
  groups: ArchiveLogGroup[]
  toggle: (key: string) => void
  reset: () => void
}

function upsert(
  groups: ArchiveLogGroup[],
  key: string,
  change: (group: ArchiveLogGroup) => ArchiveLogGroup
): ArchiveLogGroup[] {
  const index = groups.findIndex((group) => group.key === key)
  if (index >= 0) {
    return groups.map((group, position) => (position === index ? change(group) : group))
  }

  const created: ArchiveLogGroup = {
    key,
    name: key,
    path: null,
    status: 'running',
    message: null,
    kind: null,
    files: [],
    expanded: true
  }
  return [...groups, change(created)]
}

/**
 * 処理した内容を書庫ごとにまとめて残す。
 *
 * 取り出したファイルをそのまま並べると、どの書庫の中身なのかが分からなくなる。
 * 書庫を単位にしてたたんでおき、必要なものだけ開いて中を見られるようにする。
 */
export function useArchiveLog(): ArchiveLogController {
  const [groups, setGroups] = useState<ArchiveLogGroup[]>([])

  useEffect(() => {
    const stopProgress = window.zipper.archive.onTaskProgress((progress: TaskProgress) => {
      if (progress.currentFile === '') return

      const key = progress.archive?.name ?? '書庫'

      setGroups((current) =>
        upsert(current, key, (group) => {
          const last = group.files[group.files.length - 1]
          if (last === progress.currentFile) return group
          // やり直したときは前回の記録を捨ててから積み直す
          const base = group.status === 'running' ? group.files : []
          return {
            ...group,
            status: 'running',
            message: null,
            kind: null,
            files: [...base, progress.currentFile].slice(-FILE_LIMIT)
          }
        })
      )
    })

    const stopOutcome = window.zipper.archive.onTaskOutcome((outcome: ArchiveOutcome) => {
      setGroups((current) =>
        upsert(current, outcome.name, (group) => ({
          ...group,
          name: outcome.name === '' ? group.name : outcome.name,
          path: outcome.path,
          status: outcome.ok ? 'done' : 'failed',
          message: outcome.ok ? null : extractFailureMessage(outcome.kind ?? 'unknown'),
          kind: outcome.ok ? null : (outcome.kind ?? 'unknown'),
          // 終わったものは畳んでおく。失敗したものは理由を見せたいので開いたままにする
          expanded: !outcome.ok
        }))
      )
    })

    return () => {
      stopProgress()
      stopOutcome()
    }
  }, [])

  const toggle = useCallback((key: string) => {
    setGroups((current) =>
      current.map((group) => (group.key === key ? { ...group, expanded: !group.expanded } : group))
    )
  }, [])

  return { groups, toggle, reset: () => setGroups([]) }
}
