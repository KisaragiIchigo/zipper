import { domAnimation, LazyMotion } from 'framer-motion'
import { useCallback, useMemo, useState } from 'react'

import { ArchiveContent } from './ArchiveContent'
import { buildExtractRequest } from './buildExtractRequest'
import { buildTaskView, resolveTaskOwner } from './buildTaskView'
import { DialogStack } from './DialogStack'
import { DropOverlay } from './DropOverlay'
import { useRowMenu } from './useRowMenu'
import { useShellLaunch } from './useShellLaunch'
import { resolveVisibleEntries } from './resolveVisibleEntries'
import { useDirectoryNavigation } from './useDirectoryNavigation'
import { useEntryOpener } from './useEntryOpener'
import { useSelection } from './useSelection'
import { Breadcrumb } from '@/components/Breadcrumb'
import { TaskProgressDialog } from '@/components/TaskProgressDialog'
import { UpdateBanner } from '@/components/UpdateBanner'
import { StatusBar } from '@/components/StatusBar'
import { TaskBar } from '@/components/TaskBar'
import { TitleBar } from '@/components/TitleBar'
import { Toolbar } from '@/components/Toolbar'
import { useArchive } from '@/hooks/useArchive'
import { useCompress } from '@/hooks/useCompress'
import { useExtract } from '@/hooks/useExtract'
import { useDragOut } from '@/hooks/useDragOut'
import { useFileDrop } from '@/hooks/useFileDrop'
import { useOverwriteQuestion } from '@/hooks/useOverwriteQuestion'
import { useSevenZipProbe } from '@/hooks/useSevenZipProbe'
import { directoryOf, namedFolderFor } from '@/lib/pathUtils'

import { useTheme } from '@/hooks/useTheme'
import { useUpdater } from '@/hooks/useUpdater'
import { useModifyArchive } from '@/hooks/useModifyArchive'
import { usePreview } from '@/hooks/usePreview'
import { useVerify } from '@/hooks/useVerify'

export function MainApp() {
  const { theme, setMode } = useTheme()
  const probe = useSevenZipProbe()
  const archive = useArchive()
  const extract = useExtract()
  const compress = useCompress()
  const updater = useUpdater()
  const overwrite = useOverwriteQuestion()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [query, setQuery] = useState('')

  const { state } = archive
  const info = state.status === 'ready' ? state.info : null
  const navigation = useDirectoryNavigation(info?.path ?? null)
  const entries = useMemo(
    () => resolveVisibleEntries(info, query, navigation.currentPath),
    [info, navigation.currentPath, query]
  )
  // 絞り込みや移動で見えなくなった行を選んだままにしない
  const selection = useSelection((info?.path ?? '') + '|' + query + '|' + navigation.currentPath)
  const verify = useVerify(archive.path, archive.password, info?.entries.length ?? 0)
  const opener = useEntryOpener(info, archive.password)
  const preview = usePreview(info, archive.password)
  const modify = useModifyArchive({
    archivePath: archive.path,
    password: archive.password,
    onChanged: archive.reload
  })

  const startExtract = useCallback(
    (destination?: string) => {
      if (info === null) return
      const request = buildExtractRequest(info, selection.selected, archive.password)
      extract.start(destination === undefined ? request : { ...request, destination })
    },
    [archive.password, extract, info, selection.selected]
  )

  const rowMenu = useRowMenu({
    info,
    archivePath: archive.path,
    entries,
    selection,
    navigation,
    opener,
    preview,
    modify,
    onExtract: startExtract
  })

  const dragOut = useDragOut(info, archive.password, selection.selected)
  const dragging = useFileDrop(archive.openMany)
  useShellLaunch({ open: archive.openMany, compress, extract })

  const taskView = buildTaskView({
    extract: extract.state,
    compress: compress.state,
    verify: verify.state,
    modify: modify.state,
    openError: opener.error
  })
  const taskOwner = resolveTaskOwner(extract, verify, modify, compress)

  return (
    <LazyMotion features={domAnimation} strict>
      <div className="flex h-full flex-col bg-bg">
        <TitleBar
          theme={theme}
          onModeChange={setMode}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <UpdateBanner {...updater} />

        <Toolbar
          archivePath={archive.path}
          selectedCount={selection.selected.size}
          canExtract={info !== null}
          onPick={archive.pick}
          onClose={archive.close}
          onExtract={startExtract}
          hereDirectory={archive.path === null ? '' : directoryOf(archive.path)}
          namedFolder={archive.path === null ? '' : namedFolderFor(archive.path)}
          onCompress={compress.begin}
          onVerify={verify.start}
          canModify={rowMenu.actions.canModify}
          onAddFiles={modify.addFiles}
          onRemove={rowMenu.actions.onRemove}
          query={query}
          onQueryChange={setQuery}
        />

        {info !== null && query.trim() === '' ? (
          <Breadcrumb
            currentPath={navigation.currentPath}
            onNavigate={navigation.navigate}
            onUp={navigation.goUp}
          />
        ) : null}

        <main className="relative min-h-0 flex-1 overflow-hidden">
          <ArchiveContent
            state={state}
            entries={entries}
            selected={selection.selected}
            onSelectionChange={selection.select}
            onOpenEntry={rowMenu.openEntry}
            onPreviewEntry={preview.open}
            onDragOut={dragOut}
            onNavigateUp={navigation.goUp}
            menu={rowMenu.actions}
          />
          {dragging ? <DropOverlay /> : null}
        </main>

        <TaskBar
          view={taskView}
          onDismiss={() => {
            taskOwner.dismiss()
            opener.dismiss()
          }}
          onReveal={taskOwner.reveal ?? (() => undefined)}
        />

        <StatusBar
          probe={probe}
          archive={info}
          visibleCount={entries.length}
          filtering={query.trim() !== ''}
          codepage={archive.codepage}
          onCodepageChange={archive.setCodepage}
        />

        <TaskProgressDialog view={taskView} onCancel={taskOwner.cancel} />

        <DialogStack
          archive={archive}
          overwrite={overwrite}
          extract={extract}
          compress={compress}
          modify={modify}
          preview={preview}
          updater={updater}
          settingsOpen={settingsOpen}
          onCloseSettings={() => setSettingsOpen(false)}
        />

      </div>
    </LazyMotion>
  )
}
