import type { TaskProgress } from '@shared/types'

/**
 * 進み具合を全体の一部分へ押し込める。
 * tar を挟むときに 2 度 0% から進むと、止まったように見えてしまうため。
 */
export function scaleProgress(
  onProgress: ((progress: TaskProgress) => void) | undefined,
  from: number,
  to: number
): ((progress: TaskProgress) => void) | undefined {
  if (onProgress === undefined) return undefined
  return (progress) =>
    onProgress({ ...progress, percent: from + Math.round((progress.percent * (to - from)) / 100) })
}
