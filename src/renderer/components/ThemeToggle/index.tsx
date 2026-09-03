import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import type { ThemeMode, ThemeState } from '@shared/types'
import { IconButton } from '@/components/ui/IconButton'
import { cn } from '@/lib/cn'

const OPTIONS = [
  { mode: 'system', label: 'システム設定に従う', icon: Monitor },
  { mode: 'light', label: 'ライト', icon: Sun },
  { mode: 'dark', label: 'ダーク', icon: Moon }
] as const satisfies readonly { mode: ThemeMode; label: string; icon: typeof Sun }[]

interface ThemeToggleProps {
  theme: ThemeState
  onModeChange: (mode: ThemeMode) => void
}

export function ThemeToggle({ theme, onModeChange }: ThemeToggleProps) {
  const ActiveIcon = theme.resolved === 'dark' ? Moon : Sun

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <IconButton label="外観の切り替え">
          <ActiveIcon className="h-4 w-4" strokeWidth={1.5} />
        </IconButton>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className={cn(
            'animate-flyout z-[40] min-w-[13rem] rounded-overlay border border-line',
            'bg-surface-deep p-1 shadow-flyout backdrop-blur-acrylic'
          )}
        >
          {OPTIONS.map(({ mode, label, icon: Icon }) => {
            const active = theme.mode === mode
            return (
              <DropdownMenu.Item
                key={mode}
                onSelect={() => onModeChange(mode)}
                className={cn(
                  'flex h-8 cursor-default select-none items-center gap-2.5 rounded-control px-2.5',
                  'text-fluid text-primary outline-none transition-colors duration-fast ease-fluent',
                  'data-[highlighted]:bg-subtle-hover'
                )}
              >
                <Icon className="h-4 w-4 text-secondary" strokeWidth={1.5} />
                <span className="flex-1">{label}</span>
                {active ? <Check className="h-4 w-4 text-accent" strokeWidth={2} /> : null}
              </DropdownMenu.Item>
            )
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
