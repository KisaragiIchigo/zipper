import type { TaskProgress } from '@shared/types'

export const EMPTY_PROGRESS: TaskProgress = {
  percent: 0,
  completed: 0,
  total: 0,
  currentFile: ''
}

export interface Timing {
  elapsedMs: number
  /** 残りの見込み。進み具合が読めないうちは null */
  remainingMs: number | null
}

/**
 * 経過した時間から残りを見積もる。
 * 進み具合に対して一定の速さで進む前提の粗い計算で、始まったばかりのうちは出さない。
 */
export function estimateTiming(percent: number, startedAt: number, now: number): Timing {
  const elapsedMs = Math.max(0, now - startedAt)
  if (percent <= 0 || percent >= 100) return { elapsedMs, remainingMs: null }

  const remainingMs = Math.round((elapsedMs / percent) * (100 - percent))
  return { elapsedMs, remainingMs }
}

/** 00:00:00 の形にする。1 時間に満たない場合も桁を揃える */
export function formatDuration(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return '--:--:--'

  const total = Math.max(0, Math.round(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}
