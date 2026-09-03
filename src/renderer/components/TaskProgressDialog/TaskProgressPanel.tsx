import type { TaskProgress } from '@shared/types'
import { cn } from '@/lib/cn'
import { ArchiveLogView } from './ArchiveLogView'
import { TaskProgressHeader } from './TaskProgressHeader'
import { useArchiveLog } from './useArchiveLog'

interface TaskProgressPanelProps {
  label: string
  progress: TaskProgress
  startedAt: number
  onCancel: () => void
}

/** 一覧の上に重ねて見せる進み具合。処理が終われば呼び出し側ごと閉じる */
export function TaskProgressPanel({
  label,
  progress,
  startedAt,
  onCancel
}: TaskProgressPanelProps) {
  const log = useArchiveLog()

  return (
    <div className="flex min-h-0 flex-col">
      <TaskProgressHeader label={label} progress={progress} startedAt={startedAt} />

      <ArchiveLogView
        groups={log.groups}
        onToggle={log.toggle}
        autoScroll
        className="mt-2 h-40"
      />

      <div className="mt-4 flex shrink-0 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className={cn(
            'h-8 rounded-control border border-line px-4 text-fluid text-primary',
            'transition-colors duration-fast ease-fluent hover:bg-subtle-hover'
          )}
        >
          中止
        </button>
      </div>
    </div>
  )
}
