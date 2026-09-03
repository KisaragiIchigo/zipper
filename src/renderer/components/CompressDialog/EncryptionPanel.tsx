import { FORMAT_TRAITS } from '@shared/archiveFormats'
import type { CompressSettings } from '@/hooks/useCompress'
import { FIELD_LABEL, SELECT_CLASS } from './fields'

interface EncryptionPanelProps {
  settings: CompressSettings
  onChange: <K extends keyof CompressSettings>(key: K, value: CompressSettings[K]) => void
}

/**
 * パスワードを設定したときだけ現れる、暗号化の詳細。
 * 選べる内容が形式によって変わるため、ここで出し分ける。
 */
export function EncryptionPanel({ settings, onChange }: EncryptionPanelProps) {
  if (settings.password === '' || !FORMAT_TRAITS[settings.format].password) return null

  return (
    <div className="mt-3 rounded-control border border-line bg-surface p-3">
      {settings.format === '7z' ? (
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={settings.encryptHeader}
            onChange={(event) => onChange('encryptHeader', event.target.checked)}
            className="mt-0.5"
          />
          <span className="text-xs text-secondary">
            ファイル名も暗号化します。中身の一覧を見るだけでもパスワードが必要になります。
          </span>
        </label>
      ) : (
        <label className="flex flex-col gap-1.5">
          <span className={FIELD_LABEL}>暗号化方式</span>
          <select
            value={settings.zipEncryption}
            onChange={(event) =>
              onChange('zipEncryption', event.target.value as CompressSettings['zipEncryption'])
            }
            className={SELECT_CLASS}
          >
            <option value="AES256">AES-256（推奨）</option>
            <option value="ZipCrypto">ZipCrypto（古い環境向け）</option>
          </select>
          <span className="text-xs text-secondary">
            ZipCrypto は古い解凍ソフトでも開けますが、解読されやすい方式です。
          </span>
        </label>
      )}
    </div>
  )
}
