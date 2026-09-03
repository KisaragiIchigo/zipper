import type { TaskProgress } from '@shared/types'
import { estimateTiming, formatDuration } from '@/lib/taskTiming'
import { baseNameOf } from '@/lib/pathUtils'
import { useTicker } from './useTicker'

interface TaskProgressHeaderProps {
  label: string
  progress: TaskProgress
  startedAt: number
}

/** 進み具合を表す帯 */
function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-4 w-full overflow-hidden rounded-control border border-line bg-surface">
      <div
        className="h-full bg-accent transition-[width] duration-normal ease-fluent"
        style={{ width: percent + '%' }}
      />
    </div>
  )
}

/** 処理中の割合、対象の書庫、経過時間、いま扱っているファイルをまとめて見せる */
export function TaskProgressHeader({ label, progress, startedAt }: TaskProgressHeaderProps) {
  const now = useTicker(true)
  const timing = estimateTiming(progress.percent, startedAt, now)
  const counter = progress.total > 0 ? ' [' + progress.completed + '/' + progress.total + ']' : ''
  const archive = progress.archive

  return (
    <div className="shrink-0">
      <p className="font-display text-fluid-lg font-medium text-primary">
        {progress.percent}%{counter} {label}
      </p>

      {archive === undefined ? null : (
        <p className="mt-1 truncate text-fluid text-secondary" title={archive.name}>
          {archive.name}（{archive.index} / {archive.total} 件目）
        </p>
      )}

      <div className="mt-4 flex items-baseline justify-between">
        <span className="font-mono text-xs text-secondary">{progress.percent}%</span>
        <span className="font-mono text-xs text-secondary">
          {formatDuration(timing.elapsedMs)} / {formatDuration(timing.remainingMs)}
        </span>
      </div>
      <div className="mt-1.5">
        <ProgressBar percent={progress.percent} />
      </div>

      <p className="mt-3 truncate text-fluid text-accent" title={progress.currentFile}>
        {progress.currentFile === '' ? '準備しています' : baseNameOf(progress.currentFile)}
      </p>
    </div>
  )
}
