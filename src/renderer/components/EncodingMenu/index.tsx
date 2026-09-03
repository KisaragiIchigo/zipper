import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, Languages } from 'lucide-react'
import { CODEPAGE_LABELS, CODEPAGE_OPTIONS } from '@shared/codepages'
import type { Codepage, FilenameEncoding } from '@shared/types'
import { cn } from '@/lib/cn'

interface EncodingMenuProps {
  /** 手動で選択中のコードページ。null は自動判定に任せている状態 */
  current: Codepage | null
  /** 自動判定の結果。補正が入らなかった場合は null */
  detected: FilenameEncoding | null
  onChange: (codepage: Codepage | null) => void
}

const ITEM_CLASS = cn(
  'flex h-8 cursor-default select-none items-center gap-2.5 rounded-control px-2.5',
  'text-fluid text-primary outline-none transition-colors duration-fast ease-fluent',
  'data-[highlighted]:bg-subtle-hover'
)

export function EncodingMenu({ current, detected, onChange }: EncodingMenuProps) {
  const summary =
    current !== null
      ? CODEPAGE_LABELS[current]
      : detected !== null
        ? CODEPAGE_LABELS[detected.codepage] + '（自動）'
        : '自動判定'

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={cn(
          'flex h-7 items-center gap-1.5 rounded-control px-2',
          'text-xs text-secondary transition-colors duration-fast ease-fluent',
          'hover:bg-subtle-hover hover:text-primary',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent'
        )}
      >
        <Languages className="h-3.5 w-3.5" strokeWidth={1.5} />
        <span>{summary}</span>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          side="top"
          sideOffset={6}
          className={cn(
            'animate-flyout z-[40] min-w-[15rem] rounded-overlay border border-line',
            'bg-surface-deep p-1 shadow-flyout backdrop-blur-acrylic'
          )}
        >
          <DropdownMenu.Item className={ITEM_CLASS} onSelect={() => onChange(null)}>
            <span className="flex-1">自動判定にまかせる</span>
            {current === null ? <Check className="h-4 w-4 text-accent" strokeWidth={2} /> : null}
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-line" />

          {CODEPAGE_OPTIONS.map((codepage) => (
            <DropdownMenu.Item
              key={codepage}
              className={ITEM_CLASS}
              onSelect={() => onChange(codepage)}
            >
              <span className="flex-1">{CODEPAGE_LABELS[codepage]}</span>
              {current === codepage ? (
                <Check className="h-4 w-4 text-accent" strokeWidth={2} />
              ) : null}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
