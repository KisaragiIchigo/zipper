import { domAnimation, LazyMotion } from 'framer-motion'
import { useRef } from 'react'
import { ConflictDialog } from '@/components/ConflictDialog'
import { PasswordDialog } from '@/components/PasswordDialog'
import { ArchiveLogView } from '@/components/TaskProgressDialog/ArchiveLogView'
import { TaskProgressHeader } from '@/components/TaskProgressDialog/TaskProgressHeader'
import { useArchiveLog } from '@/components/TaskProgressDialog/useArchiveLog'
import { useExtract } from '@/hooks/useExtract'
import { useOverwriteQuestion } from '@/hooks/useOverwriteQuestion'
import { useTheme } from '@/hooks/useTheme'
import { ProgressActions } from './progress/ProgressActions'
import { ProgressSummary } from './progress/ProgressSummary'
import { useLockedArchives } from './progress/useLockedArchives'
import { useLaunchIntent, type ExtractMode } from './useLaunchIntent'

/**
 * 解凍のためだけに起こされたときの画面。
 *
 * 一覧は出さず、進み具合と記録だけを見せる。
 * 終わっても勝手には閉じない。どの書庫を取り出したか、どれが失敗したかを
 * 読み終えてから閉じてもらう。
 */
export function ProgressApp() {
  // 見た目を OS に合わせるためだけに使う
  useTheme()
  const extract = useExtract()
  const log = useArchiveLog()
  const overwrite = useOverwriteQuestion()
  // やり直すときに同じ取り出し方を使う
  const mode = useRef<ExtractMode>('folder')

  useLaunchIntent({
    onOpen: () => undefined,
    onCompress: () => undefined,
    onExtract: (paths, requested) => {
      mode.current = requested
      extract.startBatch({ archives: paths, mode: requested })
    }
  })

  const { state } = extract
  const running = state.status === 'running'
  const hasFailure = log.groups.some((group) => group.status === 'failed')
  const locked = useLockedArchives(log.groups, running)

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="flex h-full flex-col bg-bg p-4">
        {running ? (
          <TaskProgressHeader
            label="展開しています"
            progress={state.progress}
            startedAt={state.startedAt}
          />
        ) : (
          <ProgressSummary state={state} hasFailure={hasFailure} />
        )}

        <ArchiveLogView
          groups={log.groups}
          onToggle={log.toggle}
          autoScroll={running}
          className="mt-3 min-h-0 flex-1"
        />

        <ProgressActions state={state} onCancel={extract.cancel} />
      </div>

      <ConflictDialog
        open={overwrite.question !== null}
        conflicts={overwrite.question?.conflicts ?? []}
        onResolve={overwrite.answer}
        {...(overwrite.question === null
          ? {}
          : { archive: overwrite.question.archive, total: overwrite.question.total })}
      />

      <PasswordDialog
        open={locked.target !== null}
        archivePath={locked.target?.path ?? ''}
        retry={locked.target?.retry ?? false}
        onSubmit={(password) => {
          const target = locked.target
          if (target === null) return
          extract.startBatch({ archives: [target.path], mode: mode.current, password })
        }}
        onCancel={locked.dismiss}
      />
    </LazyMotion>
  )
}
