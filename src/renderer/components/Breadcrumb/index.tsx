import { ChevronRight, CornerLeftUp, Package } from 'lucide-react'
import { breadcrumbSegments } from '@/lib/buildDirectoryView'
import { cn } from '@/lib/cn'

interface BreadcrumbProps {
  currentPath: string
  onNavigate: (path: string) => void
  onUp: () => void
}

const LINK = cn(
  'shrink-0 whitespace-nowrap rounded-control px-1.5 py-0.5 text-xs text-secondary',
  'transition-colors duration-fast ease-fluent hover:bg-subtle-hover hover:text-primary'
)

/** いま見ているフォルダの位置と、上位への戻り道 */
export function Breadcrumb({ currentPath, onNavigate, onUp }: BreadcrumbProps) {
  const segments = breadcrumbSegments(currentPath)

  return (
    <div className="flex h-8 shrink-0 items-center gap-0.5 border-b border-line-subtle bg-surface px-2">
      <button
        type="button"
        onClick={onUp}
        disabled={currentPath === ''}
        aria-label="上のフォルダへ"
        title="上のフォルダへ（Backspace）"
        className={cn(
          'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-control',
          'text-secondary transition-colors duration-fast ease-fluent',
          'hover:bg-subtle-hover hover:text-primary',
          'disabled:pointer-events-none disabled:opacity-40'
        )}
      >
        <CornerLeftUp className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>

      <button type="button" onClick={() => onNavigate('')} className={cn(LINK, 'flex items-center gap-1.5')}>
        <Package className="h-3.5 w-3.5" strokeWidth={1.5} />
        書庫の最上位
      </button>

      {segments.map((segment) => (
        <span key={segment.path} className="flex min-w-0 items-center">
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={1.5} />
          <button
            type="button"
            onClick={() => onNavigate(segment.path)}
            className={cn(LINK, 'truncate')}
            title={segment.path}
          >
            {segment.name}
          </button>
        </span>
      ))}
    </div>
  )
}
