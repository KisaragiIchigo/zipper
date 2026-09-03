import { FolderOpen, X } from 'lucide-react'
import type { ExtractState } from '@/hooks/useExtract'
import { cn } from '@/lib/cn'

const ACTION = cn(
  'flex h-8 items-center gap-1.5 rounded-control border border-line px-3',
  'text-fluid text-primary transition-colors duration-fast ease-fluent hover:bg-subtle-hover'
)

interface ProgressActionsProps {
  state: ExtractState
  onCancel: () => void
}

/**
 * 画面の下に置く操作。
 * 終わったあとは自動で閉じず、記録を読み終えた人が自分で閉じる。
 */
export function ProgressActions({ state, onCancel }: ProgressActionsProps) {
  return (
    <div className="mt-3 flex shrink-0 justify-end gap-2">
      {state.status === 'running' ? (
        <button type="button" onClick={onCancel} className={ACTION}>
          中止
        </button>
      ) : (
        <>
          {state.status === 'done' ? (
            <button
              type="button"
              onClick={() => window.zipper.shell.reveal(state.destination)}
              className={ACTION}
            >
              <FolderOpen className="h-4 w-4 text-secondary" strokeWidth={1.5} />
              場所を開く
            </button>
          ) : null}
          <button type="button" onClick={() => window.zipper.app.close()} className={ACTION}>
            <X className="h-4 w-4 text-secondary" strokeWidth={1.5} />
            閉じる
          </button>
        </>
      )}
    </div>
  )
}
