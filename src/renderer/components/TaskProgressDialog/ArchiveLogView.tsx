import { ChevronDown, ChevronRight, CircleCheck, CircleX, Loader } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { ArchiveLogGroup } from './useArchiveLog'
import { cn } from '@/lib/cn'

interface ArchiveLogViewProps {
  groups: ArchiveLogGroup[]
  onToggle: (key: string) => void
  /** 行が増えるたびに末尾へ送るかどうか。処理中だけ true にする */
  autoScroll: boolean
  className?: string
}

/** 書庫の行の右端に置く印。処理中か、終わったか、失敗したかを示す */
function StatusMark({ status }: { status: ArchiveLogGroup['status'] }) {
  if (status === 'running') {
    return <Loader className="h-3.5 w-3.5 shrink-0 animate-spin text-accent" strokeWidth={1.5} />
  }
  if (status === 'failed') {
    return <CircleX className="h-3.5 w-3.5 shrink-0 text-danger-text" strokeWidth={1.5} />
  }
  return <CircleCheck className="h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={1.5} />
}

/**
 * 処理した内容を書庫ごとにたたんで見せる。
 *
 * 中のファイルをそのまま並べると数千行になって読めないため、
 * 既定では書庫名だけを並べ、開いたものの中身だけを見せる。
 */
export function ArchiveLogView({ groups, onToggle, autoScroll, className }: ArchiveLogViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!autoScroll) return
    const element = scrollRef.current
    if (element !== null) element.scrollTop = element.scrollHeight
  }, [groups, autoScroll])

  return (
    <div
      ref={scrollRef}
      className={cn('overflow-auto rounded-control border border-line bg-surface p-1.5', className)}
    >
      {groups.length === 0 ? (
        <p className="px-1 py-0.5 text-fluid text-secondary">まだ記録はありません</p>
      ) : (
        groups.map((group) => (
          <div key={group.key} className="mb-0.5 last:mb-0">
            <button
              type="button"
              onClick={() => onToggle(group.key)}
              className={cn(
                'flex w-full items-center gap-1.5 rounded-control px-1 py-1 text-left',
                'transition-colors duration-fast ease-fluent hover:bg-subtle-hover'
              )}
            >
              {group.expanded ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-secondary" strokeWidth={1.5} />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-secondary" strokeWidth={1.5} />
              )}
              <span
                className="min-w-0 flex-1 truncate text-fluid text-primary"
                title={group.name === '' ? undefined : group.name}
              >
                {group.name === '' ? '書庫' : group.name}
              </span>
              <span className="shrink-0 text-xs text-secondary">
                <span className="font-mono">{group.files.length}</span> 件
              </span>
              <StatusMark status={group.status} />
            </button>

            {group.message === null ? null : (
              <p className="px-2 pb-1 pl-7 text-fluid text-danger-text">{group.message}</p>
            )}

            {!group.expanded ? null : (
              <div className="pb-1 pl-7">
                {group.files.map((file, index) => (
                  <p
                    key={file + index}
                    className="truncate py-0.5 font-mono text-xs text-secondary"
                    title={file}
                  >
                    {file}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
