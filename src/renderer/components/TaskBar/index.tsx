import { m } from 'framer-motion'
import { CircleCheck, CircleX, FolderOpen, X } from 'lucide-react'
import type { TaskView } from '@/lib/taskView'
import { cn } from '@/lib/cn'

interface TaskBarProps {
  view: TaskView
  onDismiss: () => void
  onReveal: (destination: string) => void
}

/** 終わった作業の結果を、作業の邪魔にならない位置で知らせる */
export function TaskBar({ view, onDismiss, onReveal }: TaskBarProps) {
  // 進行中は専用の窓が受け持つ。ここでは終わったことだけを伝える
  if (view.kind === 'hidden' || view.kind === 'running') return null

  return (
    <m.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: [0, 0, 0, 1] }}
      className="flex h-9 shrink-0 items-center gap-3 border-t border-line bg-surface px-3"
    >
      {view.kind === 'done' ? (
        <>
          <CircleCheck className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.5} />
          <span
            className="min-w-0 flex-1 truncate text-xs text-secondary"
            title={view.destination}
          >
            {view.label}
          </span>
          {view.destination === undefined ? null : (
            <button
              type="button"
              onClick={() => onReveal(view.destination ?? '')}
              className={cn(
                'flex h-6 shrink-0 items-center gap-1.5 rounded-control border border-line px-2',
                'text-xs text-primary transition-colors duration-fast ease-fluent hover:bg-subtle-hover'
              )}
            >
              <FolderOpen className="h-3.5 w-3.5" strokeWidth={1.5} />
              場所を開く
            </button>
          )}
          <DismissButton onDismiss={onDismiss} />
        </>
      ) : (
        <>
          <CircleX className="h-4 w-4 shrink-0 text-danger-text" strokeWidth={1.5} />
          <span className="min-w-0 flex-1 truncate text-xs text-danger-text">{view.message}</span>
          <DismissButton onDismiss={onDismiss} />
        </>
      )}
    </m.div>
  )
}

function DismissButton({ onDismiss }: { onDismiss: () => void }) {
  return (
    <button
      type="button"
      onClick={onDismiss}
      aria-label="閉じる"
      className={cn(
        'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-control',
        'text-secondary transition-colors duration-fast ease-fluent hover:bg-subtle-hover'
      )}
    >
      <X className="h-3.5 w-3.5" strokeWidth={1.5} />
    </button>
  )
}
