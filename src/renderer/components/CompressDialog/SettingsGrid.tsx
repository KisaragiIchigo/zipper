import { FORMAT_TRAITS } from '@shared/archiveFormats'
import type { ArchiveFormat, CompressionLevel } from '@shared/types'
import type { CompressSettings } from '@/hooks/useCompress'
import { cn } from '@/lib/cn'
import { FIELD_LABEL, FORMATS, LEVELS, SELECT_CLASS, VOLUMES } from './fields'

interface SettingsGridProps {
  settings: CompressSettings
  onChange: <K extends keyof CompressSettings>(key: K, value: CompressSettings[K]) => void
}

/** 形式・圧縮レベル・パスワード・分割サイズ */
export function SettingsGrid({ settings, onChange }: SettingsGridProps) {
  const traits = FORMAT_TRAITS[settings.format]

  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      <label className="flex flex-col gap-1.5">
        <span className={FIELD_LABEL}>形式</span>
        <select
          value={settings.format}
          onChange={(event) => onChange('format', event.target.value as ArchiveFormat)}
          className={SELECT_CLASS}
        >
          {FORMATS.map((format) => (
            <option key={format.value} value={format.value}>
              {format.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={FIELD_LABEL}>圧縮レベル</span>
        <select
          value={settings.level}
          onChange={(event) => onChange('level', Number(event.target.value) as CompressionLevel)}
          disabled={!traits.levels}
          className={cn(SELECT_CLASS, 'disabled:opacity-40')}
        >
          {LEVELS.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={FIELD_LABEL}>パスワード（任意）</span>
        <input
          type="password"
          value={settings.password}
          onChange={(event) => onChange('password', event.target.value)}
          placeholder={traits.password ? '設定しない' : traits.label + ' は非対応'}
          disabled={!traits.password}
          className={cn(SELECT_CLASS, 'placeholder:text-muted disabled:opacity-40')}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={FIELD_LABEL}>分割サイズ</span>
        <select
          value={settings.volumeSize}
          onChange={(event) => onChange('volumeSize', event.target.value)}
          disabled={traits.selfExtracting && settings.selfExtracting}
          className={cn(SELECT_CLASS, 'disabled:opacity-40')}
        >
          {VOLUMES.map((volume) => (
            <option key={volume.value} value={volume.value}>
              {volume.label}
            </option>
          ))}
        </select>
      </label>

      {traits.selfExtracting ? (
        <label className="col-span-2 flex items-start gap-2">
          <input
            type="checkbox"
            checked={settings.selfExtracting}
            onChange={(event) => onChange('selfExtracting', event.target.checked)}
            className="mt-0.5"
          />
          <span className="text-xs text-secondary">
            自己解凍形式（.exe）にします。解凍ソフトが入っていない環境でも、実行するだけで展開できます。
            分割との併用はできません。
          </span>
        </label>
      ) : null}

      {traits.multiFile ? null : (
        <p className="col-span-2 text-xs text-secondary">
          {traits.label}{' '}
          は 1 つのファイルだけを詰める形式です。複数のファイルやフォルダを選んだ場合は、
          いったん TAR にまとめてから詰めます（{traits.tarExtension} になります）。
        </p>
      )}
    </div>
  )
}
