const UNITS = ['KB', 'MB', 'GB', 'TB'] as const

/** 1024 進法でサイズを整形する。桁を揃えたいので小数は 1 桁に固定 */
export function formatSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '-'
  if (bytes < 1024) return bytes + ' B'

  let value = bytes / 1024
  let unitIndex = 0
  while (value >= 1024 && unitIndex < UNITS.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return value.toFixed(1) + ' ' + UNITS[unitIndex]
}

/** 7-Zip の "2026-09-02 14:28:11.0505391" から秒以下を落とす */
export function formatModified(value: string | null): string {
  if (value === null) return '-'
  const match = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/.exec(value)
  return match === null ? value : match[1] + ' ' + match[2]
}

/** 圧縮率。元サイズが 0 のときは表示しない */
export function formatRatio(size: number, packed: number): string {
  if (size <= 0 || packed <= 0) return '-'
  return Math.round((packed / size) * 100) + '%'
}
