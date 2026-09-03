import type { Codepage } from './types'

export const CODEPAGE_LABELS: Record<Codepage, string> = {
  65001: 'UTF-8',
  932: '日本語 (Shift_JIS)',
  949: '韓国語 (UHC)',
  936: '簡体中国語 (GBK)',
  950: '繁体中国語 (Big5)'
}

/** 手動切り替えで提示する順。使用頻度の高いものを先に置く */
export const CODEPAGE_OPTIONS: readonly Codepage[] = [65001, 932, 949, 936, 950]
