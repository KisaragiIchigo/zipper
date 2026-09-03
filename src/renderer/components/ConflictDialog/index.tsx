import * as Dialog from '@radix-ui/react-dialog'
import { FileStack } from 'lucide-react'
import type { OverwriteMode } from '@shared/types'
import { cn } from '@/lib/cn'

const PREVIEW_LIMIT = 5

const CHOICES: { mode: OverwriteMode; label: string; description: string }[] = [
  {
    mode: 'overwrite',
    label: '上書きする',
    description: '展開先のファイルを、書庫の中身で置き換えます。'
  },
  {
    mode: 'skip',
    label: '既存を残す',
    description: '同名のファイルは展開せず、展開先のものをそのまま残します。'
  },
  {
    mode: 'rename',
    label: '両方残す',
    description: '展開先のファイルを残したまま、書庫の中身を別名で取り出します。'
  }
]

interface ConflictDialogProps {
  open: boolean
  conflicts: readonly string[]
  onResolve: (mode: OverwriteMode | null) => void
  /** 対象の書庫。まとめて取り出す途中で尋ねるときに示す */
  archive?: string
  /** ぶつかっている総数。conflicts が抜粋のときに渡す */
  total?: number
}

/** 展開先に同名のファイルがあるとき、失う前に選ばせる */
export function ConflictDialog({
  open,
  conflicts,
  onResolve,
  archive,
  total
}: ConflictDialogProps) {
  const count = total ?? conflicts.length
  const remainder = count - Math.min(conflicts.length, PREVIEW_LIMIT)

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onResolve(null)}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[50] bg-black/30" />
        <Dialog.Content
          className={cn(
            'animate-flyout fixed left-1/2 top-1/2 z-[50] w-[min(30rem,calc(100vw-3rem))]',
            '-translate-x-1/2 -translate-y-1/2 rounded-overlay border border-line',
            'bg-surface-deep p-5 shadow-dialog backdrop-blur-acrylic'
          )}
        >
          <div className="flex items-start gap-3">
            <FileStack className="mt-0.5 h-5 w-5 shrink-0 text-warning-text" strokeWidth={1.5} />
            <div className="min-w-0 flex-1">
              <Dialog.Title className="font-display text-fluid-lg font-medium text-primary">
                同じ名前のファイルがあります
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-fluid text-secondary">
                {archive === undefined ? '' : archive + ' の'}展開先に {count}{' '}
                個の同名ファイルが見つかりました。扱いを選んでください。
                {archive === undefined ? '' : ' 選んだ扱いは、残りの書庫にも使います。'}
              </Dialog.Description>
            </div>
          </div>

          <ul className="mt-3 max-h-32 overflow-auto rounded-control border border-line bg-surface px-3 py-2">
            {conflicts.slice(0, PREVIEW_LIMIT).map((path) => (
              <li key={path} className="truncate py-0.5 text-xs text-secondary" title={path}>
                {path}
              </li>
            ))}
            {remainder > 0 ? (
              <li className="py-0.5 text-xs text-secondary">ほか {remainder} 個</li>
            ) : null}
          </ul>

          <div className="mt-4 flex flex-col gap-2">
            {CHOICES.map((choice) => (
              <button
                key={choice.mode}
                type="button"
                onClick={() => onResolve(choice.mode)}
                className={cn(
                  'rounded-control border border-line px-3 py-2 text-left',
                  'transition-colors duration-fast ease-fluent hover:bg-subtle-hover',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent'
                )}
              >
                <span className="block text-fluid font-medium text-primary">{choice.label}</span>
                <span className="mt-0.5 block text-xs text-secondary">{choice.description}</span>
              </button>
            ))}
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => onResolve(null)}
              className={cn(
                'h-8 rounded-control border border-line px-3 text-fluid text-primary',
                'transition-colors duration-fast ease-fluent hover:bg-subtle-hover'
              )}
            >
              展開しない
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
