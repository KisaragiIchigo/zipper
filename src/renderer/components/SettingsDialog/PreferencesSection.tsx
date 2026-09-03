import { FolderOpen } from 'lucide-react'
import type { AppPreferences } from '@shared/types'
import type { PreferencesController } from '@/hooks/usePreferences'
import { cn } from '@/lib/cn'
import { SECONDARY_BUTTON } from './buttons'

const FIELD = cn(
  'w-full rounded-control border border-line bg-surface-solid px-2 py-1.5',
  'text-fluid text-primary shadow-control outline-none',
  'transition-shadow duration-fast ease-fluent focus:shadow-control-focus'
)

const LABEL = 'text-xs uppercase tracking-wider text-secondary'

interface FieldProps {
  label: string
  description: string
  children: React.ReactNode
}

/** 見出しと説明を添えた入力ひとつ分 */
function Field({ label, description, children }: FieldProps) {
  return (
    <div className="mt-3">
      <span className={LABEL}>{label}</span>
      <p className="mb-1.5 mt-1 text-xs text-secondary">{description}</p>
      {children}
    </div>
  )
}

/** 除外するファイル名、作業フォルダ、更新の確認、ツールチップ */
export function PreferencesSection({ controller }: { controller: PreferencesController }) {
  const preferences = controller.preferences
  if (preferences === null) return null

  const setValue = <K extends keyof AppPreferences>(key: K, value: AppPreferences[K]): void =>
    controller.update(key, value)

  return (
    <section className="mt-4 rounded-card border border-line bg-surface p-4">
      <h2 className={LABEL}>詳細</h2>

      <Field
        label="除外するファイル"
        description="圧縮と解凍のどちらでも、ここに書いた名前は対象から外します。1 行に 1 つずつ記述してください。"
      >
        <textarea
          value={preferences.excludePatterns.join('\n')}
          onChange={(event) =>
            setValue(
              'excludePatterns',
              event.target.value
                .split('\n')
                .map((line) => line.trim())
                .filter((line) => line !== '')
            )
          }
          rows={4}
          spellCheck={false}
          className={cn(FIELD, 'resize-y font-mono text-xs')}
        />
      </Field>

      <Field
        label="作業フォルダー"
        description="解凍先や保存先を選ぶダイアログが、最初にここを開きます。空欄の場合は書庫と同じ場所から始まります。"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={preferences.workFolder}
            onChange={(event) => setValue('workFolder', event.target.value)}
            placeholder="指定しない"
            className={cn(FIELD, 'placeholder:text-muted')}
          />
          <button
            type="button"
            onClick={() => {
              void window.zipper.dialog.pickDirectory().then((picked) => {
                if (picked !== null) setValue('workFolder', picked)
              })
            }}
            className={cn(SECONDARY_BUTTON, 'shrink-0 gap-1.5')}
          >
            <FolderOpen className="h-4 w-4 text-secondary" strokeWidth={1.5} />
            選ぶ
          </button>
        </div>
      </Field>

      <label className="mt-4 flex items-start gap-2">
        <input
          type="checkbox"
          checked={preferences.checkUpdateOnStartup}
          onChange={(event) => setValue('checkUpdateOnStartup', event.target.checked)}
          className="mt-0.5"
        />
        <span className="text-xs text-secondary">
          起動したときに更新を確認します。確認は起動から数秒おいて行われるため、
          起動の速さには影響しません。
        </span>
      </label>

      <label className="mt-3 flex items-start gap-2">
        <input
          type="checkbox"
          checked={preferences.tooltipEnabled}
          onChange={(event) => setValue('tooltipEnabled', event.target.checked)}
          className="mt-0.5"
        />
        <span className="text-xs text-secondary">
          エクスプローラーで書庫にマウスを合わせたとき、中のファイル名をツールチップに表示します。
        </span>
      </label>

      {preferences.tooltipEnabled ? (
        <Field
          label="ツールチップの表示件数"
          description="多くすると読み込みに時間がかかります。"
        >
          <input
            type="number"
            min={1}
            max={50}
            value={preferences.tooltipMaxEntries}
            onChange={(event) =>
              setValue('tooltipMaxEntries', Math.min(50, Math.max(1, Number(event.target.value))))
            }
            className={cn(FIELD, 'w-24 font-mono')}
          />
        </Field>
      ) : null}
    </section>
  )
}
