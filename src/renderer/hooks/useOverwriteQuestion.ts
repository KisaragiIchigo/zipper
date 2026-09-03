import { useCallback, useEffect, useState } from 'react'
import type { OverwriteMode, OverwriteQuestion } from '@shared/types'

export interface OverwriteQuestionController {
  question: OverwriteQuestion | null
  answer: (mode: OverwriteMode | null) => void
}

/**
 * まとめて取り出す途中で届く「同じ名前のものがある」という問いを受ける。
 *
 * 右クリックからの解凍には書庫を開く画面がなく、尋ねる機会が処理中しかない。
 * 答えるまで取り出しは止まっているため、返事は必ず 1 度返す。
 */
export function useOverwriteQuestion(): OverwriteQuestionController {
  const [question, setQuestion] = useState<OverwriteQuestion | null>(null)

  useEffect(() => window.zipper.archive.onAskOverwrite(setQuestion), [])

  const answer = useCallback(
    (mode: OverwriteMode | null) => {
      setQuestion((current) => {
        if (current !== null) window.zipper.archive.answerOverwrite(current.id, mode)
        return null
      })
    },
    []
  )

  return { question, answer }
}
