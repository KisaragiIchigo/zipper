import * as ContextMenu from '@radix-ui/react-context-menu'
import {
  ClipboardCopy,
  Eye,
  FolderInput,
  FolderOpen,
  PackageOpen,
  SquareCheck,
  Trash2
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { ArchiveEntry } from '@shared/types'
import { cn } from '@/lib/cn'

export interface RowMenuActions {
  onOpen: (entry: ArchiveEntry) => void
  onPreview: (entry: ArchiveEntry) => void
  /** 宛先を渡さなければ展開先を選ばせる */
  onExtract: (destination?: string) => void
  onRemove: () => void
  onSelectAll: () => void
  onCopyPath: (entry: ArchiveEntry) => void
  /** 書き換えできない形式では取り除きを出さない */
  canModify: boolean
  /** 書庫と同じ場所 */
  hereDirectory: string
}

interface RowContextMenuProps extends RowMenuActions {
  entry: ArchiveEntry
  children: ReactNode
}

const ITEM = cn(
  'flex h-8 cursor-default select-none items-center gap-2.5 rounded-control px-2.5',
  'text-fluid text-primary outline-none transition-colors duration-fast ease-fluent',
  'data-[highlighted]:bg-subtle-hover',
  'data-[disabled]:pointer-events-none data-[disabled]:opacity-40'
)

const ICON = 'h-4 w-4 shrink-0 text-secondary'

/** 一覧の行で右クリックしたときの操作 */
export function RowContextMenu({
  entry,
  children,
  onOpen,
  onPreview,
  onExtract,
  onRemove,
  onSelectAll,
  onCopyPath,
  canModify,
  hereDirectory
}: RowContextMenuProps) {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>{children}</ContextMenu.Trigger>

      <ContextMenu.Portal>
        <ContextMenu.Content
          className={cn(
            'animate-flyout z-[40] min-w-[13rem] rounded-overlay border border-line',
            'bg-surface-deep p-1 shadow-flyout backdrop-blur-acrylic'
          )}
        >
          <ContextMenu.Item className={ITEM} onSelect={() => onOpen(entry)}>
            {entry.isDirectory ? (
              <FolderOpen className={ICON} strokeWidth={1.5} />
            ) : (
              <PackageOpen className={ICON} strokeWidth={1.5} />
            )}
            <span>{entry.isDirectory ? 'フォルダを開く' : '開く'}</span>
          </ContextMenu.Item>

          <ContextMenu.Item
            className={ITEM}
            disabled={entry.isDirectory}
            onSelect={() => onPreview(entry)}
          >
            <Eye className={ICON} strokeWidth={1.5} />
            <span className="flex-1">中身を見る</span>
            <span className="text-xs text-secondary">Space</span>
          </ContextMenu.Item>

          <ContextMenu.Separator className="my-1 h-px bg-line" />

          <ContextMenu.Item className={ITEM} onSelect={() => onExtract()}>
            <PackageOpen className={ICON} strokeWidth={1.5} />
            <span>選択したものを展開</span>
          </ContextMenu.Item>

          <ContextMenu.Item className={ITEM} onSelect={() => onExtract(hereDirectory)}>
            <FolderInput className={ICON} strokeWidth={1.5} />
            <span>ここに展開</span>
          </ContextMenu.Item>

          {canModify ? (
            <ContextMenu.Item className={ITEM} onSelect={onRemove}>
              <Trash2 className={ICON} strokeWidth={1.5} />
              <span>書庫から取り除く</span>
            </ContextMenu.Item>
          ) : null}

          <ContextMenu.Separator className="my-1 h-px bg-line" />

          <ContextMenu.Item className={ITEM} onSelect={() => onCopyPath(entry)}>
            <ClipboardCopy className={ICON} strokeWidth={1.5} />
            <span>パスをコピー</span>
          </ContextMenu.Item>

          <ContextMenu.Item className={ITEM} onSelect={onSelectAll}>
            <SquareCheck className={ICON} strokeWidth={1.5} />
            <span className="flex-1">すべて選択</span>
            <span className="text-xs text-secondary">Ctrl+A</span>
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  )
}
