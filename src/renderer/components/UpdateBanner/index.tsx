import { m } from 'framer-motion'
import { ArrowUpCircle, RefreshCw, X } from 'lucide-react'
import type { UpdaterController } from '@/hooks/useUpdater'
import { cn } from '@/lib/cn'

const ACTION = cn(
  'h-6 shrink-0 rounded-control bg-accent px-2.5 text-xs font-medium text-white',
  'transition-all duration-fast ease-fluent hover:bg-accent-hover active:scale-[0.98]'
)

/** 新しい版があること、取得の進み具合、適用の合図を伝える */
export function UpdateBanner({ status, dismissed, download, install, dismiss }: UpdaterController) {
  const visible =
    !dismissed &&
    (status.phase === 'available' || status.phase === 'downloading' || status.phase === 'ready')
  if (!visible) return null

  return (
    <m.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: [0, 0, 0, 1] }}
      className="flex h-9 shrink-0 items-center gap-3 border-b border-accent/25 bg-accent/[0.08] px-3"
    >
      <ArrowUpCircle className="h-4 w-4 shrink-0 text-accent" strokeWidth={1.5} />

      {status.phase === 'available' ? (
        <>
          <span className="min-w-0 flex-1 truncate text-xs text-primary">
            新しい版 v{status.version} が公開されています
          </span>
          <button type="button" onClick={download} className={ACTION}>
            取得する
          </button>
        </>
      ) : status.phase === 'downloading' ? (
        <>
          <span className="shrink-0 text-xs text-secondary">取得しています</span>
          <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-normal ease-fluent"
              style={{ width: status.percent + '%' }}
            />
          </div>
          <span className="shrink-0 font-mono text-xs text-accent">{status.percent}%</span>
        </>
      ) : (
        <>
          <span className="min-w-0 flex-1 truncate text-xs text-primary">
            v{status.version} の準備ができました。再起動すると新しい版に切り替わります
          </span>
          <button type="button" onClick={install} className={cn(ACTION, 'flex items-center gap-1.5')}>
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
            再起動して更新
          </button>
        </>
      )}

      <button
        type="button"
        onClick={dismiss}
        aria-label="この知らせを閉じる"
        className={cn(
          'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-control',
          'text-secondary transition-colors duration-fast ease-fluent hover:bg-subtle-hover'
        )}
      >
        <X className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
    </m.div>
  )
}
