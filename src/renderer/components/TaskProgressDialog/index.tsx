import * as Dialog from '@radix-ui/react-dialog'
import type { TaskView } from '@/lib/taskView'
import { cn } from '@/lib/cn'
import { TaskProgressPanel } from './TaskProgressPanel'

interface TaskProgressDialogProps {
  view: TaskView
  onCancel: () => void
}

/** 書庫を開いて操作している最中の進み具合を、前面に重ねて見せる */
export function TaskProgressDialog({ view, onCancel }: TaskProgressDialogProps) {
  if (view.kind !== 'running') return null

  return (
    <Dialog.Root open>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[50] bg-black/40" />
        <Dialog.Content
          onEscapeKeyDown={(event) => event.preventDefault()}
          onInteractOutside={(event) => event.preventDefault()}
          className={cn(
            'animate-flyout fixed left-1/2 top-1/2 z-[50] w-[min(34rem,calc(100vw-3rem))]',
            '-translate-x-1/2 -translate-y-1/2 rounded-overlay border border-line',
            'bg-surface-deep p-5 shadow-dialog backdrop-blur-acrylic'
          )}
        >
          <Dialog.Title className="sr-only">{view.label}</Dialog.Title>
          <Dialog.Description className="sr-only">
            処理の進み具合を表示しています
          </Dialog.Description>

          <TaskProgressPanel
            label={view.label}
            progress={view.progress}
            startedAt={view.startedAt}
            onCancel={onCancel}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
