import { CircleAlert, CircleCheck, Loader, TriangleAlert } from 'lucide-react'
import type { ArchiveInfo, Codepage, SevenZipProbe } from '@shared/types'
import { EncodingMenu } from '@/components/EncodingMenu'
import { formatSize } from '@/lib/format'

interface StatusBarProps {
  probe: SevenZipProbe | null
  archive: ArchiveInfo | null
  /** 絞り込み後に見えている件数 */
  visibleCount: number
  /** 絞り込み中かどうか。フォルダを潜って件数が減った状態と区別する */
  filtering: boolean
  codepage: Codepage | null
  onCodepageChange: (codepage: Codepage | null) => void
}

function EngineStatus({ probe }: { probe: SevenZipProbe | null }) {
  if (probe === null) {
    return (
      <>
        <Loader className="h-3.5 w-3.5 animate-spin text-secondary" strokeWidth={1.5} />
        <span className="text-xs text-secondary">解凍エンジンを確認しています</span>
      </>
    )
  }
  if (!probe.available) {
    return (
      <>
        <CircleAlert className="h-3.5 w-3.5 shrink-0 text-danger-text" strokeWidth={1.5} />
        <span className="truncate text-xs text-danger-text" title={probe.path}>
          {probe.reason}
        </span>
      </>
    )
  }
  return (
    <>
      <CircleCheck className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
      <span className="text-xs text-secondary">7-Zip</span>
      <span className="rounded bg-accent/10 px-1.5 font-mono text-xs text-accent">
        {probe.version}
      </span>
    </>
  )
}

export function StatusBar({
  probe,
  archive,
  visibleCount,
  filtering,
  codepage,
  onCodepageChange
}: StatusBarProps) {
  const totalSize = archive?.entries.reduce((sum, entry) => sum + entry.size, 0) ?? 0
  const fileCount = archive?.entries.filter((entry) => !entry.isDirectory).length ?? 0


  return (
    <footer className="flex h-7 shrink-0 items-center gap-2 border-t border-line bg-surface px-3">
      <EngineStatus probe={probe} />

      {archive !== null ? (
        <>
          <span className="ml-auto text-xs uppercase tracking-wider text-secondary">
            {archive.type}
          </span>
          <span className="font-mono text-xs text-secondary">
            {filtering ? visibleCount + ' / ' + archive.entries.length + ' 件' : fileCount + ' 個'}
          </span>
          <span className="font-mono text-xs text-secondary">{formatSize(totalSize)}</span>
          {archive.hasWarning ? (
            <span
              className="flex items-center gap-1 text-xs text-warning-text"
              title="書庫の一部に問題があります。内容が不完全な可能性があります。"
            >
              <TriangleAlert className="h-3.5 w-3.5" strokeWidth={1.5} />
              警告
            </span>
          ) : null}
          <EncodingMenu
            current={codepage}
            detected={archive.encoding}
            onChange={onCodepageChange}
          />
        </>
      ) : null}
    </footer>
  )
}
