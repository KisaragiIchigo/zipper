import * as Dialog from '@radix-ui/react-dialog'
import { TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel: string
  /** 元に戻せない操作は、確認のボタンを警告色にする */
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** 取り返しのつかない操作の前に、一度手を止めてもらう */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[50] bg-black/30" />
        <Dialog.Content
          className={cn(
            'animate-flyout fixed left-1/2 top-1/2 z-[50] w-[min(28rem,calc(100vw-3rem))]',
            '-translate-x-1/2 -translate-y-1/2 rounded-overlay border border-line',
            'bg-surface-deep p-5 shadow-dialog backdrop-blur-acrylic'
          )}
        >
          <div className="flex items-start gap-3">
            <TriangleAlert
              className={cn('mt-0.5 h-5 w-5 shrink-0', destructive ? 'text-danger-text' : 'text-accent')}
              strokeWidth={1.5}
            />
            <div className="min-w-0 flex-1">
              <Dialog.Title className="font-display text-fluid-lg font-medium text-primary">
                {title}
              </Dialog.Title>
              <Dialog.Description asChild>
                <div className="mt-1 text-fluid text-secondary">{description}</div>
              </Dialog.Description>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className={cn(
                'h-8 rounded-control border border-line px-3 text-fluid text-primary',
                'transition-colors duration-fast ease-fluent hover:bg-subtle-hover'
              )}
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={cn(
                'h-8 rounded-control px-3 text-fluid font-medium text-white',
                'transition-all duration-fast ease-fluent active:scale-[0.98]',
                destructive ? 'bg-danger hover:opacity-90' : 'bg-accent hover:bg-accent-hover'
              )}
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
