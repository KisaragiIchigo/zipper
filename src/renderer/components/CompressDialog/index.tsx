import * as Dialog from '@radix-ui/react-dialog'
import { Package } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, type CompressSettings } from '@/hooks/useCompress'
import { cn } from '@/lib/cn'
import { EncryptionPanel } from './EncryptionPanel'
import { SettingsGrid } from './SettingsGrid'
import { SourceList } from './SourceList'

interface CompressDialogProps {
  open: boolean
  sources: readonly string[]
  onAddFiles: () => void
  onAddFolder: () => void
  onRemove: (path: string) => void
  onSubmit: (settings: CompressSettings) => void
  onClose: () => void
}

export function CompressDialog({
  open,
  sources,
  onAddFiles,
  onAddFolder,
  onRemove,
  onSubmit,
  onClose
}: CompressDialogProps) {
  const [settings, setSettings] = useState<CompressSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    if (open) setSettings(DEFAULT_SETTINGS)
  }, [open])

  const update = <K extends keyof CompressSettings>(key: K, value: CompressSettings[K]): void =>
    setSettings((current) => ({ ...current, [key]: value }))

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[50] bg-black/30" />
        <Dialog.Content
          className={cn(
            'animate-flyout fixed left-1/2 top-1/2 z-[50] w-[min(34rem,calc(100vw-3rem))]',
            'max-h-[calc(100vh-4rem)] -translate-x-1/2 -translate-y-1/2 overflow-auto',
            'rounded-overlay border border-line bg-surface-deep p-5 shadow-dialog backdrop-blur-acrylic'
          )}
        >
          <div className="flex items-start gap-3">
            <Package className="mt-0.5 h-5 w-5 shrink-0 text-accent" strokeWidth={1.5} />
            <div className="min-w-0 flex-1">
              <Dialog.Title className="font-display text-fluid-lg font-medium text-primary">
                書庫を作成
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-fluid text-secondary">
                圧縮する対象と方式を指定してください。保存先は次の画面で選びます。
              </Dialog.Description>
            </div>
          </div>

          <SourceList
            sources={sources}
            onAddFiles={onAddFiles}
            onAddFolder={onAddFolder}
            onRemove={onRemove}
          />

          <SettingsGrid settings={settings} onChange={update} />
          <EncryptionPanel settings={settings} onChange={update} />

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'h-8 rounded-control border border-line px-3 text-fluid text-primary',
                'transition-colors duration-fast ease-fluent hover:bg-subtle-hover'
              )}
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={() => onSubmit(settings)}
              disabled={sources.length === 0}
              className={cn(
                'h-8 rounded-control bg-accent px-3 text-fluid font-medium text-white',
                'transition-all duration-fast ease-fluent hover:bg-accent-hover active:scale-[0.98]',
                'disabled:pointer-events-none disabled:opacity-40'
              )}
            >
              保存先を選んで作成
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
