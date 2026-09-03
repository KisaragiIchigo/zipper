import { CircleAlert, Loader } from 'lucide-react'
import type { ShellIntegrationController } from '@/hooks/useShellIntegration'
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from './buttons'

interface EntryProps {
  title: string
  registered: boolean
  description: string
  children?: React.ReactNode
}

/** 入口ひとつ分の状態と説明 */
function Entry({ title, registered, description, children }: EntryProps) {
  return (
    <div className="mt-2 rounded-control border border-line bg-surface-deep p-3">
      <div className="flex items-center gap-2">
        <span className="text-fluid font-medium text-primary">{title}</span>
        <span className="ml-auto text-fluid text-secondary">
          {registered ? '登録済み' : '未登録'}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-secondary">{description}</p>
      {children}
    </div>
  )
}

/** エクスプローラーの右クリックに出る 2 つの入口の状態 */
export function ShellSection({ integration }: { integration: ShellIntegrationController }) {
  const status = integration.status

  return (
    <section className="mt-4 rounded-card border border-line bg-surface p-4">
      <h2 className="text-xs uppercase tracking-wider text-secondary">シェル統合</h2>
      <p className="mt-2 text-fluid text-secondary">
        エクスプローラーの右クリックには 2 つの入口があります。書庫では解凍の操作が、
        ファイルとフォルダでは圧縮の操作が並びます。
      </p>

      {status === null ? (
        <span className="mt-3 flex items-center gap-2 text-fluid text-secondary">
          <Loader className="h-4 w-4 animate-spin" strokeWidth={1.5} />
          状態を確認しています
        </span>
      ) : (
        <>
          <Entry
            title="右クリックの一段目"
            registered={status.packageRegistered}
            description="Windows 11 で、右クリックを押してすぐ見える位置に出ます。インストール時に登録されるため、ここからの変更はできません。"
          />

          <Entry
            title="その他のオプションを表示"
            registered={status.registered}
            description="Windows 10 ではこちらが使われます。管理者権限は必要ありません。"
          >
            <div className="mt-2.5 flex justify-end gap-2">
              <button
                type="button"
                onClick={integration.register}
                disabled={integration.busy}
                className={status.registered ? SECONDARY_BUTTON : PRIMARY_BUTTON}
              >
                {status.registered ? '登録し直す' : '登録する'}
              </button>
              <button
                type="button"
                onClick={integration.unregister}
                disabled={integration.busy || !status.registered}
                className={SECONDARY_BUTTON}
              >
                解除する
              </button>
            </div>
          </Entry>

          {!status.packaged ? (
            <div className="mt-3 flex items-start gap-2 rounded-control border border-warning/25 bg-warning/10 p-3">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning-text" strokeWidth={1.5} />
              <p className="text-xs text-warning-text">
                開発中のため、登録される実行ファイルは Electron 本体になります。
                実際に利用する場合は、インストールした Zipper から登録してください。
              </p>
            </div>
          ) : null}
        </>
      )}

      {integration.error !== null ? (
        <p className="mt-2 text-xs text-danger-text">{integration.error}</p>
      ) : null}

      <p className="mt-3 text-xs text-secondary">
        既定で開くアプリの変更は、Windows の仕様によりアプリ側からは行えません。
        Windows の設定にある「既定のアプリ」から Zipper を選択してください。
      </p>
    </section>
  )
}
