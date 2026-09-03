import type { TaskProgress } from '@shared/types'
import { parseTaskOutput } from './parseTaskOutput'

export interface ProgressOptions {
  /** 全体の件数。呼び出し側が一覧から数えて渡す */
  total?: number
  onProgress?: (progress: TaskProgress) => void
}

/**
 * 7-Zip の出力を読み進めながら、いまの状態を組み立てる。
 *
 * 進み具合・件数・ファイル名は別々の行に現れ、毎回すべてが揃うわけではない。
 * 直前の値を保って、届いた分だけを更新する。
 */
export function createProgressReporter(options: ProgressOptions): (chunk: string) => void {
  const total = options.total ?? 0
  let percent = 0
  let completed = 0
  let currentFile = ''

  return (chunk) => {
    const update = parseTaskOutput(chunk)
    if (update.percent === null && update.completed === null && update.currentFile === null) return

    if (update.percent !== null) percent = update.percent
    if (update.completed !== null) completed = update.completed
    if (update.currentFile !== null) currentFile = update.currentFile

    options.onProgress?.({ percent, completed, total, currentFile })
  }
}
