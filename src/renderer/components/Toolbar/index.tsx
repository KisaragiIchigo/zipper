import { FilePlus, FolderOpen, Package, ShieldCheck, Trash2, X } from 'lucide-react'
import { ExtractMenu } from '@/components/ExtractMenu'
import { SearchBox } from '@/components/SearchBox'
import { baseNameOf } from '@/lib/pathUtils'
import { cn } from '@/lib/cn'

interface ToolbarProps {
  archivePath: string | null
  selectedCount: number
  canExtract: boolean
  onPick: () => void
  onClose: () => void
  onExtract: (destination?: string) => void
  hereDirectory: string
  namedFolder: string
  onCompress: () => void
  onVerify: () => void
  /** 書き換えできない形式では、追加と取り除きを出さない */
  canModify: boolean
  onAddFiles: () => void
  onRemove: () => void
  query: string
  onQueryChange: (value: string) => void
}

const SECONDARY_BUTTON = cn(
  'flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-control border border-line px-3',
  'text-fluid text-primary transition-all duration-fast ease-fluent',
  'hover:bg-subtle-hover active:scale-[0.98]',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent',
  'disabled:pointer-events-none disabled:opacity-40'
)

export function Toolbar({
  archivePath,
  selectedCount,
  canExtract,
  onPick,
  onClose,
  onExtract,
  hereDirectory,
  namedFolder,
  onCompress,
  onVerify,
  canModify,
  onAddFiles,
  onRemove,
  query,
  onQueryChange
}: ToolbarProps) {
  return (
    <div className="flex h-commandbar shrink-0 items-center gap-2 border-b border-line bg-surface px-3 backdrop-blur-acrylic">
      <button
        type="button"
        onClick={onPick}
        className={cn(
          'flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-control px-3',
          'bg-accent text-fluid font-medium text-white',
          'transition-all duration-fast ease-fluent',
          'hover:scale-[1.01] hover:bg-accent-hover active:scale-[0.98] active:bg-accent-pressed',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
        )}
      >
        <FolderOpen className="h-4 w-4" strokeWidth={1.5} />
        <span>書庫を開く</span>
      </button>

      <button type="button" onClick={onCompress} className={SECONDARY_BUTTON}>
        <Package className="h-4 w-4 text-secondary" strokeWidth={1.5} />
        <span>圧縮</span>
      </button>

      {canModify ? (
        <button
          type="button"
          onClick={onAddFiles}
          aria-label="書庫にファイルを追加"
          title="書庫の最上位にファイルを追加します"
          className={cn(SECONDARY_BUTTON, 'w-8 justify-center px-0')}
        >
          <FilePlus className="h-4 w-4 text-secondary" strokeWidth={1.5} />
        </button>
      ) : null}

      {canModify && selectedCount > 0 ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="選択した項目を書庫から取り除く"
          title="選択した項目を書庫から取り除きます"
          className={cn(SECONDARY_BUTTON, 'w-8 justify-center px-0')}
        >
          <Trash2 className="h-4 w-4 text-secondary" strokeWidth={1.5} />
        </button>
      ) : null}

      {canExtract ? (
        <button
          type="button"
          onClick={onVerify}
          aria-label="中身を確認"
          title="中身を読み直して、壊れていないか確認します"
          className={cn(SECONDARY_BUTTON, 'w-8 justify-center px-0')}
        >
          <ShieldCheck className="h-4 w-4 text-secondary" strokeWidth={1.5} />
        </button>
      ) : null}

      {canExtract ? (
        <ExtractMenu
          selectedCount={selectedCount}
          hereDirectory={hereDirectory}
          namedFolder={namedFolder}
          onExtract={onExtract}
        />
      ) : null}

      {archivePath !== null ? (
        <>
          <span className="ml-2 min-w-0 shrink truncate text-fluid text-primary" title={archivePath}>
            {baseNameOf(archivePath)}
          </span>
          <div className="ml-auto flex min-w-0 shrink items-center gap-2">
            <SearchBox value={query} onChange={onQueryChange} />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="書庫を閉じる"
            title="書庫を閉じる"
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-control',
              'text-secondary transition-colors duration-fast ease-fluent',
              'hover:bg-subtle-hover hover:text-primary active:bg-subtle-pressed'
            )}
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </>
      ) : null}
    </div>
  )
}
