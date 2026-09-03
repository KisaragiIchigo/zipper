import * as Dialog from '@radix-ui/react-dialog'
import { FileQuestion, Loader, X } from 'lucide-react'
import type { PreviewState } from '@/hooks/usePreview'
import { formatSize } from '@/lib/format'
import { baseNameOf } from '@/lib/pathUtils'
import { cn } from '@/lib/cn'

interface PreviewDialogProps {
  state: PreviewState
  onClose: () => void
}

function Body({ state }: { state: PreviewState }) {
  if (state.status === 'loading') {
    return (
      <div className="flex h-full items-center justify-center gap-3">
        <Loader className="h-6 w-6 animate-spin text-accent" strokeWidth={1.5} />
        <span className="text-fluid text-secondary">読み込んでいます</span>
      </div>
    )
  }

  if (state.status === 'failed') {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
        <FileQuestion className="h-10 w-10 text-danger-text" strokeWidth={1.25} />
        <p className="text-fluid text-danger-text">{state.message}</p>
      </div>
    )
  }

  if (state.status !== 'ready') return null

  if (state.content.kind === 'image') {
    return (
      <div className="flex h-full items-center justify-center bg-surface-deep p-4">
        <img
          src={state.content.dataUrl}
          alt={baseNameOf(state.entry.path)}
          className="max-h-full max-w-full object-contain"
        />
      </div>
    )
  }

  if (state.content.kind === 'text') {
    return (
      <pre className="h-full select-text overflow-auto bg-surface-deep p-4 font-mono text-xs leading-relaxed text-primary">
        {state.content.text}
      </pre>
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
      <FileQuestion className="h-10 w-10 text-muted" strokeWidth={1.25} />
      <p className="text-fluid text-secondary">{state.content.reason}</p>
    </div>
  )
}

/** 一覧から選んだ 1 件を、その場で確かめるための窓 */
export function PreviewDialog({ state, onClose }: PreviewDialogProps) {
  const open = state.status !== 'closed'
  const entry = state.status === 'closed' ? null : state.entry
  const encoding =
    state.status === 'ready' && state.content.kind === 'text' ? state.content.encoding : null

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[50] bg-black/40" />
        <Dialog.Content
          className={cn(
            'animate-flyout fixed left-1/2 top-1/2 z-[50]',
            'flex h-[min(80vh,44rem)] w-[min(72rem,calc(100vw-4rem))] flex-col',
            '-translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-overlay border border-line',
            'bg-surface-deep shadow-dialog backdrop-blur-acrylic'
          )}
        >
          <div className="flex h-10 shrink-0 items-center gap-2 border-b border-line px-3">
            <Dialog.Title className="min-w-0 flex-1 truncate text-fluid text-primary">
              {entry === null ? '' : baseNameOf(entry.path)}
            </Dialog.Title>
            {entry !== null ? (
              <span className="shrink-0 font-mono text-xs text-secondary">
                {formatSize(entry.size)}
              </span>
            ) : null}
            {encoding !== null ? (
              <span className="shrink-0 rounded bg-accent/10 px-1.5 font-mono text-xs text-accent">
                {encoding}
              </span>
            ) : null}
            <Dialog.Close
              aria-label="閉じる"
              className={cn(
                'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-control',
                'text-secondary transition-colors duration-fast ease-fluent hover:bg-subtle-hover'
              )}
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </Dialog.Close>
          </div>

          <Dialog.Description className="sr-only">書庫の中身を表示しています</Dialog.Description>
          <div className="min-h-0 flex-1">
            <Body state={state} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
