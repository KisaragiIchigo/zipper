import type { SortColumn } from '@/lib/sortEntries'

export interface ColumnDefinition {
  key: SortColumn
  label: string
  align: 'left' | 'right'
}

/** 並べ替えできる列。圧縮率は派生値のため見出しのみを別に置く */
export const COLUMNS: readonly ColumnDefinition[] = [
  { key: 'path', label: '名前', align: 'left' },
  { key: 'size', label: 'サイズ', align: 'right' },
  { key: 'packedSize', label: '圧縮後', align: 'right' },
  { key: 'kind', label: '種類', align: 'left' },
  { key: 'modified', label: '更新日時', align: 'left' }
]

/**
 * 見出しと行で同じ列幅を使う。ずれると一覧として成立しない。
 * 日時は「2026-08-07 00:45」が 1 行に収まる幅を確保する。
 * 合計の最小幅は窓の最小幅より小さく保ち、横に溢れさせない。
 */
export const GRID_TEMPLATE = 'grid-cols-[minmax(180px,1fr)_88px_88px_64px_132px_72px]'

/** 仮想化の位置計算に使う行の高さ。h-row と一致させること */
export const ROW_HEIGHT = 32
