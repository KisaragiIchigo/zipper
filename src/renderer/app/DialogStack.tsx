import { CompressDialog } from '@/components/CompressDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ConflictDialog } from '@/components/ConflictDialog'
import { PasswordDialog } from '@/components/PasswordDialog'
import { PreviewDialog } from '@/components/PreviewDialog'
import { SettingsDialog } from '@/components/SettingsDialog'
import type { ArchiveController } from '@/hooks/useArchive'
import type { OverwriteQuestionController } from '@/hooks/useOverwriteQuestion'
import type { CompressController } from '@/hooks/useCompress'
import type { ExtractController } from '@/hooks/useExtract'
import type { ModifyController } from '@/hooks/useModifyArchive'
import type { PreviewController } from '@/hooks/usePreview'
import type { UpdaterController } from '@/hooks/useUpdater'

interface DialogStackProps {
  archive: ArchiveController
  overwrite: OverwriteQuestionController
  extract: ExtractController
  compress: CompressController
  modify: ModifyController
  preview: PreviewController
  updater: UpdaterController
  settingsOpen: boolean
  onCloseSettings: () => void
}

/**
 * 前面に重なる問いかけを一箇所へ集める。
 * どれも同時には出ないが、開く条件はそれぞれの状態が持っている。
 */
export function DialogStack({
  archive,
  overwrite,
  extract,
  compress,
  modify,
  preview,
  updater,
  settingsOpen,
  onCloseSettings
}: DialogStackProps) {
  const { state } = archive

  return (
    <>
      <SettingsDialog open={settingsOpen} updater={updater} onClose={onCloseSettings} />

      <CompressDialog
        open={compress.state.status === 'configuring'}
        sources={compress.state.status === 'configuring' ? compress.state.sources : []}
        onAddFiles={compress.addFiles}
        onAddFolder={compress.addFolder}
        onRemove={compress.removeSource}
        onSubmit={compress.submit}
        onClose={compress.close}
      />

      <ConfirmDialog
        open={modify.state.status === 'confirming'}
        title="書庫から取り除きますか"
        description={
          modify.state.status === 'confirming'
            ? modify.state.targets.length +
              ' 件を書庫から取り除きます。取り除いた内容は元に戻せません。'
            : ''
        }
        confirmLabel="取り除く"
        destructive
        onConfirm={modify.confirmRemove}
        onCancel={modify.cancelConfirm}
      />

      <ConflictDialog
        open={extract.state.status === 'conflict'}
        conflicts={extract.state.status === 'conflict' ? extract.state.conflicts : []}
        onResolve={extract.resolveConflict}
      />

      {/* 右クリックからまとめて取り出している途中に届く問い */}
      <ConflictDialog
        open={overwrite.question !== null}
        conflicts={overwrite.question?.conflicts ?? []}
        onResolve={overwrite.answer}
        {...(overwrite.question === null
          ? {}
          : { archive: overwrite.question.archive, total: overwrite.question.total })}
      />

      <PreviewDialog state={preview.state} onClose={preview.close} />

      <PasswordDialog
        open={state.status === 'password'}
        archivePath={state.status === 'password' ? state.path : ''}
        retry={state.status === 'password' ? state.retry : false}
        onSubmit={archive.openWithPassword}
        onCancel={archive.close}
      />
    </>
  )
}
