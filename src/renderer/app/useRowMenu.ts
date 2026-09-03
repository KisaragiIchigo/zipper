import { useCallback, useMemo } from 'react'
import { isWritableType } from '@shared/archiveFormats'
import type { ArchiveEntry, ArchiveInfo } from '@shared/types'
import type { RowMenuActions } from '@/components/ArchiveTable/RowContextMenu'
import type { ModifyController } from '@/hooks/useModifyArchive'
import type { PreviewController } from '@/hooks/usePreview'
import { directoryOf } from '@/lib/pathUtils'
import type { DirectoryNavigation } from './useDirectoryNavigation'
import type { EntryOpener } from './useEntryOpener'
import type { SelectionController } from './useSelection'

interface RowMenuSources {
  info: ArchiveInfo | null
  archivePath: string | null
  /** いま一覧に出ている行 */
  entries: readonly ArchiveEntry[]
  selection: SelectionController
  navigation: DirectoryNavigation
  opener: EntryOpener
  preview: PreviewController
  modify: ModifyController
  onExtract: (destination?: string) => void
}

export interface RowMenu {
  actions: RowMenuActions
  /** フォルダなら潜り、ファイルなら開く。ダブルクリックと共通 */
  openEntry: (entry: ArchiveEntry) => void
}

/**
 * 行に対する操作をひとまとめにする。
 * 右クリックのメニューとダブルクリックが同じ経路を通るようにするため、開く操作もここで作る。
 */
export function useRowMenu({
  info,
  archivePath,
  entries,
  selection,
  navigation,
  opener,
  preview,
  modify,
  onExtract
}: RowMenuSources): RowMenu {
  const openEntry = useCallback(
    (entry: ArchiveEntry) => {
      if (navigation.enter(entry)) return
      opener.open(entry)
    },
    [navigation, opener]
  )

  const actions = useMemo<RowMenuActions>(
    () => ({
      onOpen: openEntry,
      onPreview: preview.open,
      onExtract,
      onRemove: () =>
        modify.requestRemove(entries.filter((entry) => selection.selected.has(entry.path))),
      onSelectAll: () => selection.select(new Set(entries.map((entry) => entry.path))),
      onCopyPath: (entry: ArchiveEntry) => window.zipper.clipboard.write(entry.path),
      canModify: info !== null && isWritableType(info.type),
      hereDirectory: archivePath === null ? '' : directoryOf(archivePath)
    }),
    [archivePath, entries, info, modify, onExtract, openEntry, preview.open, selection]
  )

  return { actions, openEntry }
}
