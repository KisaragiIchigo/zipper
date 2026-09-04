import { useCallback, useState } from 'react'
import type { Codepage, OpenArchiveRequest } from '@shared/types'
import { loadArchiveState, pathOf, type ArchiveState } from './archive/archiveState'

export interface ArchiveController {
  state: ArchiveState
  path: string | null
  password: string | undefined
  codepage: Codepage | null
  /** 書庫を開く。この窓がすでに埋まっていれば新しい窓へ回す */
  open: (path: string) => void
  /** 複数まとめて開く。1 つ目だけこの窓が引き受けることがある */
  openMany: (paths: readonly string[]) => void
  openWithPassword: (password: string) => void
  /**
   * 一覧はそのままに、鍵だけを覚え直す。
   * 中身だけを暗号化した書庫は一覧が鍵なしで読めるため、
   * 取り出す段になって初めて鍵が要ると分かる。そのとき読み込みからやり直さないため。
   */
  rememberPassword: (password: string) => void
  setCodepage: (codepage: Codepage | null) => void
  pick: () => void
  reload: () => void
  close: () => void
}

const IDLE: ArchiveState = { status: 'idle' }

/**
 * この窓が受け持つ書庫 1 つ分の状態。
 *
 * 書庫を並べて見比べたいときは窓を増やす。1 つの窓に何枚も重ねるより、
 * 並べたほうが目的の書庫へ一息でたどり着けるため。
 */
export function useArchive(): ArchiveController {
  const [request, setRequest] = useState<OpenArchiveRequest | null>(null)
  const [state, setState] = useState<ArchiveState>(IDLE)
  // 手動で選んだコードページ。自動判定に任せている場合は null
  const [codepage, setCodepageValue] = useState<Codepage | null>(null)

  const load = useCallback((next: OpenArchiveRequest) => {
    setRequest(next)
    setState({ status: 'loading', path: next.path })
    void loadArchiveState(next).then(setState)
  }, [])

  const openMany = useCallback(
    (paths: readonly string[]) => {
      if (paths.length === 0) return

      void (async () => {
        // 分割書庫の続きの巻を渡された場合、実際に開かれるのは先頭の巻
        const resolved = await Promise.all(
          paths.map(async (path) => {
            const first = await window.zipper.archive.resolvePath(path)
            return first === '' ? path : first
          })
        )

        // 同じ書庫を二重に開かない
        const unique = [...new Set(resolved)]
        const [head, ...rest] = unique

        setState((current) => {
          if (current.status !== 'idle' || head === undefined) {
            // この窓はすでに埋まっている。全部を新しい窓へ回す
            window.zipper.app.openWindows(unique)
            return current
          }
          if (rest.length > 0) window.zipper.app.openWindows(rest)
          load({ path: head })
          return { status: 'loading', path: head }
        })
      })()
    },
    [load]
  )

  const open = useCallback((path: string) => openMany([path]), [openMany])

  const openWithPassword = useCallback(
    (password: string) => {
      if (request === null) return
      load({ ...request, password })
    },
    [load, request]
  )

  const rememberPassword = useCallback((password: string) => {
    setRequest((current) => (current === null ? null : { ...current, password }))
  }, [])

  const setCodepage = useCallback(
    (next: Codepage | null) => {
      if (request === null) return
      const { codepage: _dropped, ...rest } = request
      setCodepageValue(next)
      load(next === null ? rest : { ...rest, codepage: next })
    },
    [load, request]
  )

  const pick = useCallback(() => {
    void window.zipper.archive.pick().then((path) => {
      if (path !== null) open(path)
    })
  }, [open])

  const reload = useCallback(() => {
    if (request !== null) load(request)
  }, [load, request])

  const close = useCallback(() => {
    setRequest(null)
    setCodepageValue(null)
    setState(IDLE)
  }, [])

  return {
    state,
    path: pathOf(state),
    password: request?.password,
    codepage,
    open,
    openMany,
    openWithPassword,
    rememberPassword,
    setCodepage,
    pick,
    reload,
    close
  }
}
