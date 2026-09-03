import { RefreshCw } from 'lucide-react'
import type { UpdaterController } from '@/hooks/useUpdater'
import { cn } from '@/lib/cn'
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from './buttons'

/** 更新の状態を、そのまま読める一文にする */
function updateMessage(updater: UpdaterController): string {
  switch (updater.status.phase) {
    case 'unavailable-in-dev':
      return '開発中は更新を確認できません。配布版でご利用ください。'
    case 'checking':
      return '確認しています...'
    case 'up-to-date':
      return 'お使いの版が最新です。'
    case 'available':
      return '新しい版 v' + updater.status.version + ' が公開されています。'
    case 'downloading':
      return '取得しています... ' + updater.status.percent + '%'
    case 'ready':
      return 'v' + updater.status.version + ' の準備ができました。再起動すると切り替わります。'
    case 'failed':
      return '確認に失敗しました: ' + updater.status.message
    default:
      return 'まだ確認していません。'
  }
}

export function UpdateSection({ updater }: { updater: UpdaterController }) {
  const busy = updater.status.phase === 'checking' || updater.status.phase === 'downloading'

  return (
    <section className="mt-3 rounded-card border border-line bg-surface p-4">
      <h2 className="text-xs uppercase tracking-wider text-secondary">更新</h2>
      <p className="mt-2 text-fluid text-secondary">{updateMessage(updater)}</p>

      <div className="mt-3 flex items-center gap-3">
        <span className="font-mono text-xs text-secondary">
          v{updater.version === '' ? '—' : updater.version}
        </span>

        <span className="ml-auto flex gap-2">
          {updater.status.phase === 'available' ? (
            <button type="button" onClick={updater.download} className={PRIMARY_BUTTON}>
              取得する
            </button>
          ) : null}

          {updater.status.phase === 'ready' ? (
            <button
              type="button"
              onClick={updater.install}
              className={cn(PRIMARY_BUTTON, 'flex items-center gap-1.5')}
            >
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
              再起動して更新
            </button>
          ) : null}

          <button
            type="button"
            onClick={updater.check}
            disabled={busy}
            className={SECONDARY_BUTTON}
          >
            更新を確認
          </button>
        </span>
      </div>
    </section>
  )
}
