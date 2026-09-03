import { ipcMain, type WebContents } from 'electron'
import { IPC } from '@shared/ipc'
import type { OverwriteMode, OverwriteQuestion } from '@shared/types'

/** 画面に並べて見せる名前の数。多すぎても読めない */
const PREVIEW_LIMIT = 20

/** 問いと答えを対応づける番号。窓をまたいでも重複しないよう通し番号にする */
let sequence = 0

function isMode(value: unknown): value is OverwriteMode {
  return value === 'overwrite' || value === 'skip' || value === 'rename'
}

/**
 * 展開先に同じ名前のものがあったときに、どうするかを利用者へ尋ねる。
 *
 * 右クリックからまとめて取り出す経路には、書庫を開く画面がない。
 * 断りなく上書きすると既存のファイルが黙って消えるため、ここで一度だけ尋ねる。
 */
export function askOverwrite(
  contents: WebContents,
  archive: string,
  conflicts: readonly string[]
): Promise<OverwriteMode | null> {
  sequence += 1
  const id = sequence

  return new Promise((resolve) => {
    let settled = false

    const finish = (mode: OverwriteMode | null): void => {
      if (settled) return
      settled = true
      ipcMain.off(IPC.archiveAnswerOverwrite, onAnswer)
      resolve(mode)
    }

    const onAnswer = (_event: unknown, payload: unknown): void => {
      const answer = payload as { id?: unknown; mode?: unknown } | null
      if (answer === null || answer.id !== id) return
      finish(isMode(answer.mode) ? answer.mode : null)
    }

    ipcMain.on(IPC.archiveAnswerOverwrite, onAnswer)
    // 尋ねた窓が閉じられたら、答えを待たずに取りやめる
    contents.once('destroyed', () => finish(null))

    const question: OverwriteQuestion = {
      id,
      archive,
      conflicts: conflicts.slice(0, PREVIEW_LIMIT),
      total: conflicts.length
    }
    contents.send(IPC.archiveAskOverwrite, question)
  })
}
