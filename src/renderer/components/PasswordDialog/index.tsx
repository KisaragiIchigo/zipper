import * as Dialog from '@radix-ui/react-dialog'
import { KeyRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { baseNameOf } from '@/lib/pathUtils'
import { cn } from '@/lib/cn'

interface PasswordDialogProps {
  open: boolean
  archivePath: string
  /** 直前の入力が誤っていた場合に true */
  retry: boolean
  onSubmit: (password: string) => void
  onCancel: () => void
}

export function PasswordDialog({
  open,
  archivePath,
  retry,
  onSubmit,
  onCancel
}: PasswordDialogProps) {
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (open) setPassword('')
  }, [open, archivePath, retry])

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[50] bg-black/30" />
        <Dialog.Content
          className={cn(
            'animate-flyout fixed left-1/2 top-1/2 z-[50] w-[min(26rem,calc(100vw-3rem))]',
            '-translate-x-1/2 -translate-y-1/2 rounded-overlay border border-line',
            'bg-surface-deep p-5 shadow-dialog backdrop-blur-acrylic'
          )}
        >
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-accent" strokeWidth={1.5} />
            <div className="min-w-0 flex-1">
              <Dialog.Title className="font-display text-fluid-lg font-medium text-primary">
                パスワードが必要です
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-fluid text-secondary">
                {retry
                  ? 'パスワードが正しくありません。もう一度入力してください。'
                  : 'この書庫は暗号化されています。パスワードを入力してください。'}
              </Dialog.Description>
              <p className="mt-1 truncate text-xs text-secondary" title={archivePath}>
                {baseNameOf(archivePath)}
              </p>
            </div>
          </div>

          <form
            className="mt-4 flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              if (password !== '') onSubmit(password)
            }}
          >
            <input
              type="password"
              value={password}
              autoFocus
              onChange={(event) => setPassword(event.target.value)}
              placeholder="パスワード"
              className={cn(
                'h-9 w-full rounded-control border border-line bg-surface-solid px-3',
                'text-fluid text-primary shadow-control outline-none',
                'transition-shadow duration-fast ease-fluent',
                'focus:shadow-control-focus',
                'placeholder:text-muted'
              )}
            />
            <div className="flex justify-end gap-2">
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
                type="submit"
                disabled={password === ''}
                className={cn(
                  'h-8 rounded-control bg-accent px-3 text-fluid font-medium text-white',
                  'transition-all duration-fast ease-fluent',
                  'hover:bg-accent-hover active:scale-[0.98]',
                  'disabled:pointer-events-none disabled:opacity-40'
                )}
              >
                開く
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
