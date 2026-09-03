import { CircleAlert, CircleCheck, CircleX, Loader } from 'lucide-react'
import type { ExtractState } from '@/hooks/useExtract'
import { extractFailureMessage } from '@/lib/taskView'

interface ProgressSummaryProps {
  state: ExtractState
  /** 途中で失敗した書庫があるか。全体としては終わっていても印を変える */
  hasFailure: boolean
}

/** 処理が終わったあとに、結果を 1 行で伝える見出し */
export function ProgressSummary({ state, hasFailure }: ProgressSummaryProps) {
  if (state.status === 'done') {
    return (
      <div className="flex shrink-0 items-center gap-2.5">
        {hasFailure ? (
          <CircleAlert className="h-7 w-7 shrink-0 text-warning-text" strokeWidth={1.25} />
        ) : (
          <CircleCheck className="h-7 w-7 shrink-0 text-accent" strokeWidth={1.25} />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-display text-fluid-lg font-medium text-primary">
            {state.summary ?? '解凍しました'}
          </p>
          <p className="truncate text-fluid text-secondary" title={state.destination}>
            {state.destination}
          </p>
        </div>
      </div>
    )
  }

  if (state.status === 'failed') {
    return (
      <div className="flex shrink-0 items-center gap-2.5">
        <CircleX className="h-7 w-7 shrink-0 text-danger-text" strokeWidth={1.25} />
        <div className="min-w-0 flex-1">
          <p className="font-display text-fluid-lg font-medium text-primary">解凍できませんでした</p>
          <p className="truncate text-fluid text-danger-text">
            {extractFailureMessage(state.kind)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex shrink-0 items-center gap-2.5">
      <Loader className="h-7 w-7 shrink-0 animate-spin text-accent" strokeWidth={1.25} />
      <p className="font-display text-fluid-lg font-medium text-primary">準備しています</p>
    </div>
  )
}
