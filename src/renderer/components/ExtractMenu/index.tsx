import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, FolderInput, FolderPlus, PackageOpen } from 'lucide-react'
import { baseNameOf } from '@/lib/pathUtils'
import { cn } from '@/lib/cn'

interface ExtractMenuProps {
  selectedCount: number
  /** 書庫と同じ場所 */
  hereDirectory: string
  /** 書庫と同じ場所に作る、書庫名のフォルダ */
  namedFolder: string
  /** 宛先を渡さなければダイアログで選ばせる */
  onExtract: (destination?: string) => void
}

const ITEM = cn(
  'flex cursor-default select-none items-start gap-2.5 rounded-control px-2.5 py-1.5',
  'text-fluid text-primary outline-none transition-colors duration-fast ease-fluent',
  'data-[highlighted]:bg-subtle-hover'
)

export function ExtractMenu({
  selectedCount,
  hereDirectory,
  namedFolder,
  onExtract
}: ExtractMenuProps) {
  const label = selectedCount > 0 ? '選択した ' + selectedCount + ' 件を展開' : 'すべて展開'

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className={cn(
          'flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-control border border-line px-3',
          'text-fluid text-primary transition-all duration-fast ease-fluent',
          'hover:bg-subtle-hover active:scale-[0.98]',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent'
        )}
      >
        <PackageOpen className="h-4 w-4 text-secondary" strokeWidth={1.5} />
        <span>{label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-secondary" strokeWidth={1.5} />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className={cn(
            'animate-flyout z-[40] min-w-[17rem] rounded-overlay border border-line',
            'bg-surface-deep p-1 shadow-flyout backdrop-blur-acrylic'
          )}
        >
          <DropdownMenu.Item className={ITEM} onSelect={() => onExtract(namedFolder)}>
            <FolderPlus className="mt-0.5 h-4 w-4 shrink-0 text-secondary" strokeWidth={1.5} />
            <span className="min-w-0">
              <span className="block">フォルダを作って展開</span>
              <span className="mt-0.5 block truncate text-xs text-secondary" title={namedFolder}>
                {baseNameOf(namedFolder)}
              </span>
            </span>
          </DropdownMenu.Item>

          <DropdownMenu.Item className={ITEM} onSelect={() => onExtract(hereDirectory)}>
            <FolderInput className="mt-0.5 h-4 w-4 shrink-0 text-secondary" strokeWidth={1.5} />
            <span className="min-w-0">
              <span className="block">ここに展開</span>
              <span className="mt-0.5 block truncate text-xs text-secondary" title={hereDirectory}>
                {hereDirectory}
              </span>
            </span>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="my-1 h-px bg-line" />

          <DropdownMenu.Item className={ITEM} onSelect={() => onExtract()}>
            <PackageOpen className="mt-0.5 h-4 w-4 shrink-0 text-secondary" strokeWidth={1.5} />
            <span>展開先を選ぶ</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
