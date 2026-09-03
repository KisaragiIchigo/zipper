import { useEffect, useRef } from 'react'
import type { ArchiveFormat, LaunchIntent } from '@shared/types'

/** 解凍先の決め方。シェルの各項目に対応する */
export type ExtractMode = 'ask' | 'here' | 'folder'

export interface LaunchHandlers {
  onOpen: (path: string) => void
  /** format が null なら設定画面を開く。指定があればその場で作る */
  onCompress: (paths: readonly string[], format: ArchiveFormat | null) => void
  /** 選ばれた書庫をまとめて取り出す。書庫は開かない */
  onExtract: (paths: readonly string[], mode: ExtractMode) => void
}

/**
 * この窓に割り当てられた起動要求を受け取り、対応する操作へ振り分ける。
 *
 * 要求は窓ごとに 1 つ。起動後に届いた分は Main が新しい窓を開いて渡すため、
 * ここでは描き始めたときに 1 度だけ取りに行けばよい。
 * 解凍は書庫を開かずに進めるため、複数を選んでもそのまま順に処理できる。
 */
export function useLaunchIntent(handlers: LaunchHandlers): void {
  // 呼び出し側の関数は毎回作り直されるため、購読はやり直さず最新だけを参照する
  const latest = useRef(handlers)
  latest.current = handlers

  useEffect(() => {
    const handle = (intent: LaunchIntent): void => {
      switch (intent.action) {
        case 'compress':
          latest.current.onCompress(intent.paths, null)
          return
        case 'compress-zip':
          latest.current.onCompress(intent.paths, 'zip')
          return
        case 'compress-7z':
          latest.current.onCompress(intent.paths, '7z')
          return
        case 'extract':
          latest.current.onExtract(intent.paths, 'ask')
          return
        case 'extract-here':
          latest.current.onExtract(intent.paths, 'here')
          return
        case 'extract-to-folder':
          latest.current.onExtract(intent.paths, 'folder')
          return
        default:
          break
      }

      const first = intent.paths[0]
      if (first !== undefined) latest.current.onOpen(first)
    }

    void window.zipper.archive.takePending().then((intent) => {
      if (intent !== null) handle(intent)
    })
  }, [])
}
