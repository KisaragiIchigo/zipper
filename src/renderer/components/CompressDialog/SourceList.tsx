import { FilePlus, FolderPlus, X } from 'lucide-react'
import { baseNameOf } from '@/lib/pathUtils'
import { cn } from '@/lib/cn'
import { CHIP_BUTTON, FIELD_LABEL } from './fields'

interface SourceListProps {
  sources: readonly string[]
  onAddFiles: () => void
  onAddFolder: () => void
  onRemove: (path: string) => void
}

/** 圧縮する対象の一覧と、その出し入れ */
export function SourceList({ sources, onAddFiles, onAddFolder, onRemove }: SourceListProps) {
  return (
    <>
      <div className="mt-4 flex items-center gap-2">
        <span className={FIELD_LABEL}>対象 {sources.length} 件</span>
        <button type="button" onClick={onAddFiles} className={cn('ml-auto', CHIP_BUTTON)}>
          <FilePlus className="h-3.5 w-3.5" strokeWidth={1.5} />
          ファイルを追加
        </button>
        <button type="button" onClick={onAddFolder} className={CHIP_BUTTON}>
          <FolderPlus className="h-3.5 w-3.5" strokeWidth={1.5} />
          フォルダを追加
        </button>
      </div>

      <ul className="mt-2 max-h-36 overflow-auto rounded-control border border-line bg-surface p-1">
        {sources.map((path) => (
          <li key={path} className="flex h-7 items-center gap-2 rounded-control px-2">
            <span className="min-w-0 flex-1 truncate text-xs text-primary" title={path}>
              {baseNameOf(path)}
            </span>
            <button
              type="button"
              onClick={() => onRemove(path)}
              aria-label="対象から外す"
              className="text-secondary transition-colors duration-fast hover:text-danger-text"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}
