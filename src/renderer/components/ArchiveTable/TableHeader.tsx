import { ChevronDown, ChevronUp } from 'lucide-react'
import type { SortColumn, SortState } from '@/lib/sortEntries'
import { cn } from '@/lib/cn'
import { COLUMNS, GRID_TEMPLATE } from './columns'

interface TableHeaderProps {
  sort: SortState
  onSort: (column: SortColumn) => void
}

export function TableHeader({ sort, onSort }: TableHeaderProps) {
  return (
    <div
      className={cn(
        'grid shrink-0 border-b border-line bg-surface',
        GRID_TEMPLATE,
        'text-xs uppercase tracking-wider text-secondary'
      )}
    >
      {COLUMNS.map((column) => (
        <button
          key={column.key}
          type="button"
          onClick={() => onSort(column.key)}
          className={cn(
            'flex h-8 items-center gap-1 whitespace-nowrap px-3',
            'transition-colors duration-fast ease-fluent',
            'hover:bg-subtle-hover',
            column.align === 'right' && 'justify-end'
          )}
        >
          <span className="truncate">{column.label}</span>
          {sort.column === column.key ? (
            sort.direction === 'asc' ? (
              <ChevronUp className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
            )
          ) : null}
        </button>
      ))}
      <div className="flex h-8 items-center justify-end whitespace-nowrap px-3">圧縮率</div>
    </div>
  )
}
