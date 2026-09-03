export interface ProgressUpdate {
  /** 全体の進み具合。読み取れなければ null */
  percent: number | null
  /** 処理を終えた件数。読み取れなければ null */
  completed: number | null
  /** いま処理しているファイル。読み取れなければ null */
  currentFile: string | null
}

/**
 * 7-Zip が -bsp1 と -bb1 で流す出力から、進み具合を読み取る。
 *
 * 出力はこの形で届く。進捗の行は復帰文字で上書きされるため、1 度の chunk に何度も現れる。
 *   " 14% 1"        進み具合とここまでの件数
 *   "- file_02.bin" これから処理するファイル
 * それぞれ最後に現れたものが、いまの状態を表す。
 */
export function parseTaskOutput(chunk: string): ProgressUpdate {
  let percent: number | null = null
  let completed: number | null = null
  let currentFile: string | null = null

  const progress = [...chunk.matchAll(/(\d{1,3})%(?:\s+(\d+))?/g)]
  const lastProgress = progress[progress.length - 1]

  if (lastProgress !== undefined) {
    const value = Number(lastProgress[1])
    if (Number.isFinite(value)) percent = Math.min(100, Math.max(0, value))

    const count = lastProgress[2]
    if (count !== undefined) {
      const parsed = Number(count)
      if (Number.isFinite(parsed)) completed = parsed
    }
  }

  for (const line of chunk.split(/[\r\n]+/)) {
    const match = /^- (.+)$/.exec(line.trim())
    if (match?.[1] !== undefined) currentFile = match[1]
  }

  return { percent, completed, currentFile }
}
