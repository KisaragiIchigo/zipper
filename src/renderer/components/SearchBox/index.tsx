import { Search, X } from 'lucide-react'
import { cn } from '@/lib/cn'

interface SearchBoxProps {
  value: string
  onChange: (value: string) => void
}

/** 一覧の絞り込み。書庫を開いている間だけ意味を持つ */
export function SearchBox({ value, onChange }: SearchBoxProps) {
  return (
    <div
      className={cn(
        'flex h-8 w-56 min-w-0 shrink items-center gap-1.5 rounded-control border border-line',
        'bg-surface-solid px-2 shadow-control',
        'transition-shadow duration-fast ease-fluent focus-within:shadow-control-focus'
      )}
    >
      <Search className="h-3.5 w-3.5 shrink-0 text-secondary" strokeWidth={1.5} />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="名前で絞り込む"
        className="min-w-0 flex-1 bg-transparent text-fluid text-primary outline-none placeholder:text-muted"
      />
      {value !== '' ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="絞り込みを解除"
          className="shrink-0 text-secondary transition-colors duration-fast hover:text-primary"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      ) : null}
    </div>
  )
}
