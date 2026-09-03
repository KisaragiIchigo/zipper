import { Package, Settings } from 'lucide-react'
import type { ThemeMode, ThemeState } from '@shared/types'
import { ThemeToggle } from '@/components/ThemeToggle'
import { IconButton } from '@/components/ui/IconButton'

interface TitleBarProps {
  theme: ThemeState
  onModeChange: (mode: ThemeMode) => void
  onOpenSettings: () => void
}

/**
 * キャプションボタンは Windows 純正（Window Controls Overlay）に任せる。
 * その占有幅は env(titlebar-area-width) で避けるため、自前で幅を計算しない。
 */
export function TitleBar({ theme, onModeChange, onOpenSettings }: TitleBarProps) {
  return (
    <header
      className="app-drag flex shrink-0 items-center gap-2 border-b border-line-subtle pl-3 pr-1"
      style={{
        width: 'env(titlebar-area-width, 100%)',
        height: 'env(titlebar-area-height, 40px)'
      }}
    >
      <Package className="h-4 w-4 text-accent" strokeWidth={1.5} />
      <span className="font-display text-fluid font-medium tracking-wide text-primary">Zipper</span>
      <div className="ml-auto flex items-center">
        <ThemeToggle theme={theme} onModeChange={onModeChange} />
        <IconButton label="設定" onClick={onOpenSettings}>
          <Settings className="h-4 w-4" strokeWidth={1.5} />
        </IconButton>
      </div>
    </header>
  )
}
