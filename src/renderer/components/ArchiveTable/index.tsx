import { useEffect, useMemo, useRef, useState } from 'react'
import type { ArchiveEntry } from '@shared/types'
import { useVirtualRows } from '@/hooks/useVirtualRows'
import { sortEntries, type SortColumn, type SortState } from '@/lib/sortEntries'
import { ROW_HEIGHT } from './columns'
import { TableHeader } from './TableHeader'
import type { RowMenuActions } from './RowContextMenu'
import { TableRow } from './TableRow'
import { useRowSelection } from './useRowSelection'

interface ArchiveTableProps {
  entries: readonly ArchiveEntry[]
  selected: ReadonlySet<string>
  onSelectionChange: (next: ReadonlySet<string>) => void
  onOpenEntry: (entry: ArchiveEntry) => void
  onPreviewEntry: (entry: ArchiveEntry) => void
  onDragOut: (entry: ArchiveEntry) => void
  onNavigateUp: () => void
  menu: RowMenuActions
}

export function ArchiveTable({
  entries,
  selected,
  onSelectionChange,
  onOpenEntry,
  onPreviewEntry,
  onDragOut,
  onNavigateUp,
  menu
}: ArchiveTableProps) {
  const [sort, setSort] = useState<SortState>({ column: 'path', direction: 'asc' })
  const scrollRef = useRef<HTMLDivElement>(null)

  const rows = useMemo(() => sortEntries(entries, sort), [entries, sort])
  const selection = useRowSelection({
    rows,
    selected,
    onChange: onSelectionChange,
    onOpen: onOpenEntry,
    onPreview: onPreviewEntry,
    onNavigateUp
  })
  const view = useVirtualRows(rows.length, ROW_HEIGHT, scrollRef)

  // キーボードで移った行が画面の外にあれば、最短の距離だけ寄せる
  const { focused } = selection
  useEffect(() => {
    const element = scrollRef.current
    if (element === null) return

    const top = focused * ROW_HEIGHT
    const bottom = top + ROW_HEIGHT
    if (top < element.scrollTop) element.scrollTop = top
    else if (bottom > element.scrollTop + element.clientHeight) {
      element.scrollTop = bottom - element.clientHeight
    }
  }, [focused])

  const toggleSort = (column: SortColumn): void => {
    setSort((current) =>
      current.column === column
        ? { column, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' }
    )
  }

  return (
    <div className="flex h-full flex-col outline-none" tabIndex={0} onKeyDown={selection.handleKeyDown}>
      <TableHeader sort={sort} onSort={toggleSort} />

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
        {/* 全体の高さだけを先に確保し、見えている範囲を正しい位置へずらして描く */}
        <div style={{ height: view.totalHeight }}>
          <div style={{ transform: 'translateY(' + view.offsetY + 'px)' }}>
            {rows.slice(view.start, view.end).map((entry, offset) => (
              <TableRow
                key={entry.path}
                entry={entry}
                index={view.start + offset}
                selected={selected.has(entry.path)}
                onSelect={selection.handleSelect}
                onOpen={onOpenEntry}
                onDragOut={onDragOut}
                menu={menu}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
