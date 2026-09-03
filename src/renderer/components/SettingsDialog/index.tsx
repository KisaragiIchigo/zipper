import * as Dialog from '@radix-ui/react-dialog'
import { Settings } from 'lucide-react'
import { usePreferences } from '@/hooks/usePreferences'
import { useShellIntegration } from '@/hooks/useShellIntegration'
import type { UpdaterController } from '@/hooks/useUpdater'
import { cn } from '@/lib/cn'
import { SECONDARY_BUTTON } from './buttons'
import { PreferencesSection } from './PreferencesSection'
import { ShellSection } from './ShellSection'
import { UpdateSection } from './UpdateSection'

interface SettingsDialogProps {
  open: boolean
  updater: UpdaterController
  onClose: () => void
}

export function SettingsDialog({ open, updater, onClose }: SettingsDialogProps) {
  const integration = useShellIntegration(open)
  const preferences = usePreferences(open)

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[50] bg-black/30" />
        <Dialog.Content
          className={cn(
            'animate-flyout fixed left-1/2 top-1/2 z-[50] w-[min(32rem,calc(100vw-3rem))]',
            'max-h-[calc(100vh-4rem)] -translate-x-1/2 -translate-y-1/2 overflow-auto',
            'rounded-overlay border border-line bg-surface-deep p-5 shadow-dialog backdrop-blur-acrylic'
          )}
        >
          <div className="flex items-start gap-3">
            <Settings className="mt-0.5 h-5 w-5 shrink-0 text-accent" strokeWidth={1.5} />
            <div className="min-w-0 flex-1">
              <Dialog.Title className="font-display text-fluid-lg font-medium text-primary">
                設定
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-fluid text-secondary">
                エクスプローラーとの連携、圧縮と解凍の細かな動き、更新の状態を変更できます。
              </Dialog.Description>
            </div>
          </div>

          <ShellSection integration={integration} />
          <PreferencesSection controller={preferences} />
          <UpdateSection updater={updater} />

          <div className="mt-4 flex justify-end">
            <button type="button" onClick={onClose} className={SECONDARY_BUTTON}>
              閉じる
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
