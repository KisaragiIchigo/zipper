import { COMPRESS_FORMATS, FORMAT_TRAITS } from '@shared/archiveFormats'
import type { ArchiveFormat, CompressionLevel } from '@shared/types'
import { cn } from '@/lib/cn'

/** 形式ごとの一言。選ぶときの判断材料になるものだけを書く */
const FORMAT_HINTS: Readonly<Record<ArchiveFormat, string>> = {
  zip: 'どの環境でも開けます',
  '7z': '圧縮率が高くなります',
  tar: 'まとめるだけで、詰めません',
  gzip: '1 つのファイル向け。複数選ぶと TAR にまとめます',
  bzip2: 'GZIP より詰まりますが、時間がかかります',
  xz: '最も詰まりますが、展開にも時間がかかります'
}

export const FORMATS: readonly { value: ArchiveFormat; label: string }[] = COMPRESS_FORMATS.map(
  (value) => ({ value, label: FORMAT_TRAITS[value].label + ' — ' + FORMAT_HINTS[value] })
)

export const LEVELS: readonly { value: CompressionLevel; label: string }[] = [
  { value: 0, label: '無圧縮' },
  { value: 1, label: '高速' },
  { value: 5, label: '標準' },
  { value: 9, label: '最高' }
]

/** 7-Zip の -v に渡す記法。空文字は分割しないことを表す */
export const VOLUMES: readonly { value: string; label: string }[] = [
  { value: '', label: '分割しない' },
  { value: '100m', label: '100 MB' },
  { value: '700m', label: '700 MB' },
  { value: '1g', label: '1 GB' },
  { value: '4g', label: '4 GB' }
]

export const FIELD_LABEL = 'text-xs uppercase tracking-wider text-secondary'

export const SELECT_CLASS = cn(
  'h-8 w-full rounded-control border border-line bg-surface-solid px-2',
  'text-fluid text-primary shadow-control outline-none',
  'transition-shadow duration-fast ease-fluent focus:shadow-control-focus'
)

export const CHIP_BUTTON = cn(
  'flex h-7 items-center gap-1.5 rounded-control border border-line px-2',
  'text-xs text-primary transition-colors duration-fast ease-fluent hover:bg-subtle-hover'
)
