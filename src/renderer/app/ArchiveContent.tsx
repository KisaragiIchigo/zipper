import { Loader } from 'lucide-react'
import { ArchiveTable } from '@/components/ArchiveTable'
import { EmptyState } from '@/components/EmptyState'
import { FailureNotice } from '@/components/FailureNotice'
import type { ArchiveEntry } from '@shared/types'
import type { RowMenuActions } from '@/components/ArchiveTable/RowContextMenu'
import type { ArchiveState } from '@/hooks/archive/archiveState'

function LoadingView({ path }: { path: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <Loader className="h-8 w-8 animate-spin text-accent" strokeWidth={1.5} />
      <p className="max-w-md truncate px-8 text-fluid text-secondary" title={path}>
        書庫を読み込んでいます
      </p>
    </div>
  )
}

interface ArchiveContentProps {
  state: ArchiveState
  /** 絞り込み後の一覧。state.info.entries の部分集合 */
  entries: readonly ArchiveEntry[]
  selected: ReadonlySet<string>
  onSelectionChange: (next: ReadonlySet<string>) => void
  onOpenEntry: (entry: ArchiveEntry) => void
  onPreviewEntry: (entry: ArchiveEntry) => void
  onDragOut: (entry: ArchiveEntry) => void
  onNavigateUp: () => void
  menu: RowMenuActions
}

/** 書庫の状態に応じて、本体の表示を切り替える */
export function ArchiveContent({
  state,
  entries,
  selected,
  onSelectionChange,
  onOpenEntry,
  onPreviewEntry,
  onDragOut,
  onNavigateUp,
  menu
}: ArchiveContentProps) {
  switch (state.status) {
    case 'ready':
      return (
        <ArchiveTable
          entries={entries}
          selected={selected}
          onSelectionChange={onSelectionChange}
          onOpenEntry={onOpenEntry}
          onPreviewEntry={onPreviewEntry}
          onDragOut={onDragOut}
          onNavigateUp={onNavigateUp}
          menu={menu}
        />
      )
    case 'loading':
      return <LoadingView path={state.path} />
    case 'failed':
      return <FailureNotice path={state.path} kind={state.kind} />
    default:
      return <EmptyState />
  }
}
