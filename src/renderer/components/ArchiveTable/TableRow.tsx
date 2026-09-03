import { FileText, Folder, Lock } from 'lucide-react'
import type { MouseEvent as ReactMouseEvent } from 'react'
import type { ArchiveEntry } from '@shared/types'
import { formatModified, formatRatio, formatSize } from '@/lib/format'
import { entryKind } from '@/lib/sortEntries'
import { cn } from '@/lib/cn'
import { GRID_TEMPLATE } from './columns'
import { RowContextMenu, type RowMenuActions } from './RowContextMenu'

interface TableRowProps {
  entry: ArchiveEntry
  index: number
  selected: boolean
  onSelect: (event: ReactMouseEvent, path: string, index: number) => void
  onOpen: (entry: ArchiveEntry) => void
  /** エクスプローラーへ引きずり出す */
  onDragOut: (entry: ArchiveEntry) => void
  menu: RowMenuActions
}

export function TableRow({
  entry,
  index,
  selected,
  onSelect,
  onOpen,
  onDragOut,
  menu
}: TableRowProps) {
  return (
    <RowContextMenu entry={entry} {...menu}>
    <button
      type="button"
      onClick={(event) => onSelect(event, entry.path, index)}
      onDoubleClick={() => onOpen(entry)}
      draggable
      onDragStart={(event) => {
        // 既定のドラッグでは書庫の中身に実体がなく何も渡せない。OS のドラッグへ委ねる
        event.preventDefault()
        onDragOut(entry)
      }}
      className={cn(
        'grid h-row w-full items-center text-left',
        GRID_TEMPLATE,
        'transition-colors duration-fast ease-fluent',
        selected ? 'bg-accent/10' : 'hover:bg-subtle-hover'
      )}
    >
      <span className="flex min-w-0 items-center gap-2 px-3">
        {entry.isDirectory ? (
          <Folder className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.5} />
        ) : (
          <FileText className="h-4 w-4 shrink-0 text-secondary" strokeWidth={1.5} />
        )}
        <span className="truncate text-fluid text-primary" title={entry.path}>
          {entry.path}
        </span>
        {entry.encrypted ? (
          <Lock className="h-3.5 w-3.5 shrink-0 text-secondary" strokeWidth={1.5} />
        ) : null}
      </span>
      <span className="whitespace-nowrap px-3 text-right font-mono text-xs text-secondary">
        {entry.isDirectory ? '-' : formatSize(entry.size)}
      </span>
      <span className="whitespace-nowrap px-3 text-right font-mono text-xs text-secondary">
        {entry.isDirectory ? '-' : formatSize(entry.packedSize)}
      </span>
      <span className="truncate whitespace-nowrap px-3 text-xs text-secondary">{entryKind(entry)}</span>
      <span className="truncate whitespace-nowrap px-3 font-mono text-xs text-secondary">
        {formatModified(entry.modified)}
      </span>
      <span className="whitespace-nowrap px-3 text-right font-mono text-xs text-secondary">
        {entry.isDirectory ? '-' : formatRatio(entry.size, entry.packedSize)}
      </span>
    </button>
    </RowContextMenu>
  )
}
